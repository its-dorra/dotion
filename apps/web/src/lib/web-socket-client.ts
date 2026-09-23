export type WebSocketData = string | ArrayBuffer

export type WebSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

export type WebSocketClientOptions<TMessage> = {
  url: string
  channelName: string
  protocols?: string | string[]
  reconnect?: boolean
  maxReconnectDelay?: number
  ackTimeout?: number
  decodeMessage: (data: WebSocketData) => TMessage
  encodeMessage: (message: TMessage) => WebSocketData
  onDecodeError?: (error: unknown, raw: WebSocketData) => void
}

export type MessageSource = 'websocket' | 'broadcast' | 'local'

export type MessageListener<TMessage> = (data: {
  source: MessageSource
  payload: TMessage
}) => void

type StatusListener = () => void

type CrossTabMessage<TMessage> =
  | {
      type: 'client.send'
      senderId: string
      requestId: string
      encoded: WebSocketData
      payload: TMessage
    }
  | {
      type: 'client.send.ack'
      requestId: string
    }
  | {
      type: 'client.send.error'
      requestId: string
      message: string
    }
  | {
      type: 'client.message'
      data: TMessage
    }
  | {
      type: 'socket.message'
      data: TMessage
    }
  | { type: 'socket.open' }
  | { type: 'socket.close' }
  | { type: 'socket.error' }
  | {
      type: 'client.hello'
      senderId: string
    }
  | {
      type: 'leader.state'
      status: WebSocketStatus
    }

const LEADER_LOCK_PREFIX = 'websocket-client:'

function createClientId() {
  return crypto.randomUUID()
}

function createNoopChannel(name: string): BroadcastChannel {
  return {
    name,
    postMessage() {},
    addEventListener() {},
    removeEventListener() {},
    close() {},
    onmessage: null,
    onmessageerror: null,
    dispatchEvent: () => false,
  } as unknown as BroadcastChannel
}

interface PendingSend {
  resolve: () => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

export class WebSocketClient<TMessage> {
  private readonly clientId = createClientId()

  private readonly channel: BroadcastChannel

  private socket: WebSocket | null = null

  private status: WebSocketStatus = 'disconnected'

  private reconnectAttempt = 0

  private shouldReconnect: boolean

  private readonly ackTimeout: number

  private readonly messageListeners = new Set<MessageListener<TMessage>>()

  private readonly statusListeners = new Set<StatusListener>()

  private readonly decodeMessage: (data: WebSocketData) => TMessage

  private readonly encodeMessage: (message: TMessage) => WebSocketData

  private readonly onDecodeError?: (error: unknown, raw: WebSocketData) => void

  private leaderAbortController: AbortController | null = null

  private leaderAttemptInProgress = false

  private leader = false

  private leaderElectionTimer: ReturnType<typeof setInterval> | null = null

  private destroyed = false

  private readonly pendingSends = new Map<string, PendingSend>()

  constructor(private readonly options: WebSocketClientOptions<TMessage>) {
    this.shouldReconnect = options.reconnect ?? true
    this.ackTimeout = options.ackTimeout ?? 5_000

    this.decodeMessage = options.decodeMessage
    this.encodeMessage = options.encodeMessage
    this.onDecodeError = options.onDecodeError

    this.channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(options.channelName)
        : createNoopChannel(options.channelName)

    this.channel.addEventListener('message', this.handleBroadcastMessage)
  }

  getStatus(): WebSocketStatus {
    return this.status
  }

  isLeader(): boolean {
    return this.leader
  }

  subscribe(listener: MessageListener<TMessage>) {
    this.messageListeners.add(listener)

    return () => {
      this.messageListeners.delete(listener)
    }
  }

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener)

    return () => {
      this.statusListeners.delete(listener)
    }
  }

  connect(): void {
    if (this.destroyed) {
      return
    }

    if (
      this.status === 'connected' ||
      this.status === 'connecting' ||
      this.status === 'reconnecting'
    ) {
      return
    }

    this.shouldReconnect = this.options.reconnect ?? true

    this.setStatus('connecting')

    this.startLeaderElection()
  }

  disconnect(): void {
    this.shouldReconnect = false

    this.stopLeaderElection()

    this.leaderAbortController?.abort()
    this.leaderAbortController = null

    this.closeSocket()

    this.rejectAllPending(new Error('WebSocketClient disconnected'))

    this.setLeader(false)

    this.setStatus('disconnected')
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.destroyed = true

    this.disconnect()

    this.channel.removeEventListener('message', this.handleBroadcastMessage)

    this.channel.close()

    this.messageListeners.clear()
    this.statusListeners.clear()
  }

  send(data: TMessage): Promise<void> {
    if (this.destroyed) {
      return Promise.reject(new Error('WebSocketClient has been destroyed'))
    }

    if (this.status === 'disconnected') {
      return Promise.reject(new Error('WebSocket is not connected'))
    }

    let encoded: WebSocketData

    try {
      encoded = this.encodeMessage(data)
    } catch (error) {
      return Promise.reject(error)
    }

    if (this.leader) {
      try {
        this.sendFromLeader(encoded)

        this.channel.postMessage({
          type: 'client.message',
          data,
        } satisfies CrossTabMessage<TMessage>)

        this.notifyMessageListeners(data, 'local')

        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    }

    const requestId = crypto.randomUUID()

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const pending = this.pendingSends.get(requestId)

        if (!pending) {
          return
        }

        this.pendingSends.delete(requestId)

        pending.reject(
          new Error('No WebSocket leader tab acknowledged this send in time'),
        )
      }, this.ackTimeout)

      this.pendingSends.set(requestId, { resolve, reject, timeoutId })

      this.channel.postMessage({
        type: 'client.send',
        senderId: this.clientId,
        requestId,
        encoded,
        payload: data,
      } satisfies CrossTabMessage<TMessage>)
    })
  }

  private sendFromLeader(data: WebSocketData): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    this.socket.send(data)
  }

  private startLeaderElection(): void {
    if (this.leaderElectionTimer) {
      return
    }

    this.channel.postMessage({
      type: 'client.hello',
      senderId: this.clientId,
    } satisfies CrossTabMessage<TMessage>)

    void this.tryBecomeLeader()

    this.leaderElectionTimer = setInterval(() => {
      if (!this.shouldReconnect) {
        return
      }

      if (this.leader) {
        return
      }

      void this.tryBecomeLeader()
    }, 2000)
  }

  private stopLeaderElection(): void {
    if (!this.leaderElectionTimer) {
      return
    }

    clearInterval(this.leaderElectionTimer)

    this.leaderElectionTimer = null
  }

  private async tryBecomeLeader() {
    if (
      this.destroyed ||
      !this.shouldReconnect ||
      this.leader ||
      this.leaderAttemptInProgress
    ) {
      return
    }

    if ('locks' in navigator) {
      await this.acquireLeadershipViaLock()
    } else {
      await this.becomeLeaderWithoutLock()
    }
  }

  private async acquireLeadershipViaLock() {
    this.leaderAttemptInProgress = true

    const lockName = `${LEADER_LOCK_PREFIX}${this.options.channelName}`
    const controller = new AbortController()
    this.leaderAbortController?.abort()
    this.leaderAbortController = controller

    try {
      await navigator.locks.request(
        lockName,
        {
          mode: 'exclusive',
          signal: controller.signal,
        },
        async (lock) => {
          if (this.destroyed || !this.shouldReconnect || !lock) {
            return
          }

          this.setLeader(true)

          try {
            await this.runLeader(controller.signal)
          } finally {
            this.setLeader(false)
          }
        },
      )
    } finally {
      this.leaderAttemptInProgress = false
      this.leaderAbortController = null
    }
  }

  private async becomeLeaderWithoutLock() {
    this.leaderAttemptInProgress = true

    const controller = new AbortController()
    this.leaderAbortController?.abort()
    this.leaderAbortController = controller

    try {
      this.setLeader(true)

      try {
        await this.runLeader(controller.signal)
      } finally {
        this.setLeader(false)
      }
    } finally {
      this.leaderAttemptInProgress = false
      this.leaderAbortController = null
    }
  }

  private async runLeader(signal: AbortSignal): Promise<void> {
    while (!signal.aborted && !this.destroyed && this.shouldReconnect) {
      try {
        await this.openSocket(signal)

        if (signal.aborted) {
          break
        }

        await this.waitForSocketClose(signal)
      } catch (error) {
        if (signal.aborted) {
          break
        }
      }

      if (signal.aborted || !this.shouldReconnect) {
        break
      }

      this.setStatus('reconnecting')

      const delay = this.getReconnectDelay()

      await this.delay(delay, signal)

      this.reconnectAttempt++
    }

    this.closeSocket()
  }

  private openSocket(signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        resolve()
        return
      }

      const resolvedUrl = this.options.url.startsWith('/')
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.options.url}`
        : this.options.url

      const socket = new WebSocket(resolvedUrl, this.options.protocols)

      socket.binaryType = 'arraybuffer'

      this.socket = socket

      let settled = false

      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        cleanup()
        fn()
      }

      const cleanup = () => {
        signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        socket.close()
        settle(resolve)
      }

      signal.addEventListener('abort', onAbort, { once: true })

      socket.onopen = () => {
        this.reconnectAttempt = 0

        this.setStatus('connected')

        this.channel.postMessage({
          type: 'socket.open',
        } satisfies CrossTabMessage<TMessage>)

        socket.onmessage = (event) => {
          this.handleSocketMessage(event.data as WebSocketData)
        }

        settle(resolve)
      }

      socket.onerror = () => {
        this.channel.postMessage({
          type: 'socket.error',
        } satisfies CrossTabMessage<TMessage>)

        settle(() => reject(new Error('WebSocket connection failed')))
      }

      socket.onclose = () => {
        if (this.socket === socket) {
          this.socket = null
        }

        this.channel.postMessage({
          type: 'socket.close',
        } satisfies CrossTabMessage<TMessage>)

        this.rejectAllPending(new Error('WebSocket closed'))

        settle(resolve)
      }
    })
  }

  private waitForSocketClose(signal: AbortSignal): Promise<void> {
    const socket = this.socket

    if (!socket) {
      return Promise.resolve()
    }

    if (socket.readyState === WebSocket.CLOSED) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      let settled = false

      const finish = () => {
        if (settled) {
          return
        }

        settled = true
        signal.removeEventListener('abort', finish)
        socket.removeEventListener('close', finish)
        resolve()
      }

      signal.addEventListener('abort', finish, {
        once: true,
      })

      socket.addEventListener('close', finish, {
        once: true,
      })
    })
  }

  private handleSocketMessage(raw: WebSocketData): void {
    let data: TMessage

    try {
      data = this.decodeMessage(raw)
    } catch (error) {
      this.onDecodeError?.(error, raw)
      return
    }

    this.channel.postMessage({
      type: 'socket.message',
      data,
    } satisfies CrossTabMessage<TMessage>)

    this.notifyMessageListeners(data, 'websocket')
  }

  private handleBroadcastMessage = (
    event: MessageEvent<CrossTabMessage<TMessage>>,
  ) => {
    if (this.destroyed) {
      return
    }

    const message = event.data

    switch (message.type) {
      case 'client.send': {
        if (!this.leader) {
          return
        }

        try {
          this.sendFromLeader(message.encoded)
        } catch (error) {
          this.channel.postMessage({
            type: 'client.send.error',
            requestId: message.requestId,
            message: error instanceof Error ? error.message : String(error),
          } satisfies CrossTabMessage<TMessage>)
          return
        }

        this.channel.postMessage({
          type: 'client.send.ack',
          requestId: message.requestId,
        } satisfies CrossTabMessage<TMessage>)

        this.channel.postMessage({
          type: 'client.message',
          data: message.payload,
        } satisfies CrossTabMessage<TMessage>)

        this.notifyMessageListeners(message.payload, 'local')

        return
      }

      case 'client.send.ack': {
        const pending = this.pendingSends.get(message.requestId)

        if (!pending) {
          return
        }

        clearTimeout(pending.timeoutId)
        this.pendingSends.delete(message.requestId)
        pending.resolve()

        return
      }

      case 'client.send.error': {
        const pending = this.pendingSends.get(message.requestId)

        if (!pending) {
          return
        }

        clearTimeout(pending.timeoutId)
        this.pendingSends.delete(message.requestId)
        pending.reject(new Error(message.message))

        return
      }

      case 'client.message': {
        if (this.leader) {
          return
        }

        this.notifyMessageListeners(message.data, 'local')

        return
      }

      case 'socket.message': {
        if (this.leader) {
          return
        }

        this.notifyMessageListeners(message.data, 'broadcast')
        return
      }

      case 'socket.open': {
        if (this.leader) {
          return
        }
        this.setStatus('connected')
        return
      }

      case 'socket.close': {
        if (this.leader) {
          return
        }
        this.setStatus(this.shouldReconnect ? 'reconnecting' : 'disconnected')
        return
      }

      case 'socket.error': {
        if (this.leader) {
          return
        }
        this.setStatus(this.shouldReconnect ? 'reconnecting' : 'disconnected')
        return
      }

      case 'client.hello': {
        if (!this.leader) {
          return
        }
        this.channel.postMessage({
          type: 'leader.state',
          status: this.status,
        } satisfies CrossTabMessage<TMessage>)
        return
      }

      case 'leader.state': {
        if (this.leader) {
          return
        }
        this.setStatus(message.status)
        return
      }
    }
  }

  private notifyMessageListeners(data: TMessage, source: MessageSource): void {
    for (const listener of [...this.messageListeners]) {
      try {
        listener({ source, payload: data })
      } catch {}
    }
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) {
      return
    }

    this.status = status

    this.notifyStatusListeners()
  }

  private notifyStatusListeners(): void {
    for (const listener of [...this.statusListeners]) {
      try {
        listener()
      } catch {}
    }
  }

  private setLeader(leader: boolean): void {
    if (this.leader === leader) {
      return
    }

    this.leader = leader

    if (leader) {
      this.stopLeaderElection()

      this.rejectAllPending(
        new Error('Became leader before send was acknowledged'),
      )
    } else {
      this.closeSocket()

      this.rejectAllPending(new Error('Lost WebSocket leadership'))

      if (this.shouldReconnect && this.status !== 'disconnected') {
        this.setStatus('reconnecting')

        this.startLeaderElection()
      }
    }
  }

  private closeSocket(): void {
    const socket = this.socket

    if (!socket) {
      return
    }

    this.socket = null

    socket.onerror = null
    socket.onmessage = null
    socket.onopen = null

    socket.close()
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingSends.values()) {
      clearTimeout(pending.timeoutId)
      pending.reject(error)
    }

    this.pendingSends.clear()
  }

  private getReconnectDelay(): number {
    const maxDelay = this.options.maxReconnectDelay ?? 30_000

    const base = Math.min(1000 * 2 ** this.reconnectAttempt, maxDelay)

    const jitter = base * 0.2 * (Math.random() * 2 - 1)

    return Math.max(0, Math.round(base + jitter))
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve()
        return
      }

      const onAbort = () => {
        clearTimeout(timer)
        resolve()
      }

      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }, ms)

      signal.addEventListener('abort', onAbort, { once: true })
    })
  }
}
