import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { WebSocketClient } from '@/lib/web-socket-client'
import type { PageWsMessage } from '../types'

const MSG_SYNC = 0
const MSG_AWARENESS = 1

type ProviderEventMap = {
  synced: [boolean]
  sync: [boolean]
  status: [{ status: string }]
}

type EventName = keyof ProviderEventMap

export class PageYjsProvider {
  readonly doc: Y.Doc
  readonly awareness: Awareness

  private unsubscribeWs: (() => void) | null = null
  private unsubscribeStatus: (() => void) | null = null
  private connected = false

  private _synced = false

  private readonly _handlers = new Map<
    string,
    Set<(...args: unknown[]) => void>
  >()

  constructor(
    doc: Y.Doc,
    private readonly wsClient: WebSocketClient<PageWsMessage>,
  ) {
    this.doc = doc
    this.awareness = new Awareness(doc)
    this._setup()
  }

  // public methods required by BlockNote's collaboration extension

  get synced(): boolean {
    return this._synced
  }

  on<K extends EventName>(
    event: K,
    cb: (...args: ProviderEventMap[K]) => void,
  ): this
  on(event: string, cb: (...args: unknown[]) => void): this
  on(event: string, cb: (...args: unknown[]) => void): this {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set())
    }
    this._handlers.get(event)!.add(cb)
    return this
  }

  off<K extends EventName>(
    event: K,
    cb: (...args: ProviderEventMap[K]) => void,
  ): this
  off(event: string, cb: (...args: unknown[]) => void): this
  off(event: string, cb: (...args: unknown[]) => void): this {
    this._handlers.get(event)?.delete(cb)
    return this
  }

  private _emit(event: string, ...args: unknown[]): void {
    this._handlers.get(event)?.forEach((cb) => cb(...args))
  }

  private _markSynced(): void {
    if (this._synced) return
    this._synced = true
    this._emit('synced', true)
    this._emit('sync', true)
    this._emit('status', { status: 'connected' })
  }

  private _setup() {
    this.unsubscribeWs = this.wsClient.subscribe(({ payload }) => {
      if (payload.type === 'yjs') {
        this._handleBinaryMessage(payload.data)
      }
    })

    this.unsubscribeStatus = this.wsClient.subscribeStatus(() => {
      const status = this.wsClient.getStatus()
      if (status === 'connected') {
        if (!this.connected) {
          this.connected = true
          this._emit('status', { status: 'connecting' })
          this._synced = false
          this._sendSyncStep1()
          this._sendAwareness()
        }
      } else {
        if (this.connected) {
          this.connected = false
          this._synced = false

          const remoteClientIds = Array.from(
            this.awareness.getStates().keys(),
          ).filter((clientId) => clientId !== this.awareness.clientID)
          if (remoteClientIds.length > 0) {
            awarenessProtocol.removeAwarenessStates(
              this.awareness,
              remoteClientIds,
              this,
            )
          }
          this._emit('status', { status: 'disconnected' })
        }
      }
    })

    this.doc.on('update', this._onDocUpdate)
    this.awareness.on('update', this._onAwarenessUpdate)

    if (this.wsClient.getStatus() === 'connected') {
      this.connected = true
      this._synced = false
      this._sendSyncStep1()
      this._sendAwareness()
    }
  }

  private _handleBinaryMessage(buf: ArrayBuffer) {
    const data = new Uint8Array(buf)
    const decoder = decoding.createDecoder(data)
    const msgType = decoding.readVarUint(decoder)

    switch (msgType) {
      case MSG_SYNC: {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, MSG_SYNC)
        const syncMessageType = syncProtocol.readSyncMessage(
          decoder,
          encoder,
          this.doc,
          this,
        )

        if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
          this._markSynced()
        }

        if (encoding.length(encoder) > 1) {
          const reply = encoding.toUint8Array(encoder)
          this.wsClient
            .send({
              type: 'yjs',
              data: reply.buffer as ArrayBuffer,
            })
            .catch((error) => {
              console.warn(
                'PageYjsProvider: Failed to reply to sync message',
                error,
              )
            })
        }
        break
      }
      case MSG_AWARENESS: {
        const update = decoding.readVarUint8Array(decoder)
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this)
        break
      }
    }
  }

  private _sendSyncStep1() {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_SYNC)
    syncProtocol.writeSyncStep1(encoder, this.doc)
    const data = encoding.toUint8Array(encoder)
    this.wsClient
      .send({
        type: 'yjs',
        data: data.buffer,
      })
      .catch((error) => {
        console.warn('PageYjsProvider: Failed to send sync step 1', error)
      })
  }

  private _sendAwareness() {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
        this.doc.clientID,
      ]),
    )
    const data = encoding.toUint8Array(encoder)
    this.wsClient
      .send({
        type: 'yjs',
        data: data.buffer as ArrayBuffer,
      })
      .catch((error) => {
        console.warn('PageYjsProvider: Failed to send awareness', error)
      })
  }

  private _onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return
    if (!this.connected) return
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    const data = encoding.toUint8Array(encoder)
    this.wsClient
      .send({
        type: 'yjs',
        data: data.buffer,
      })
      .catch((error) => {
        console.warn('PageYjsProvider: Failed to send doc update', error)
      })
  }

  private _onAwarenessUpdate = ({
    added,
    updated,
    removed,
  }: {
    added: number[]
    updated: number[]
    removed: number[]
  }) => {
    const changedClients = [...added, ...updated, ...removed]
    if (changedClients.length === 0) return
    if (!this.connected) return
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
    )
    const data = encoding.toUint8Array(encoder)
    this.wsClient
      .send({
        type: 'yjs',
        data: data.buffer,
      })
      .catch((error) => {
        console.warn('PageYjsProvider: Failed to send awareness update', error)
      })
  }

  destroy() {
    this.doc.off('update', this._onDocUpdate)
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this.doc.clientID],
      'provider destroyed',
    )
    this.awareness.off('update', this._onAwarenessUpdate)
    this.unsubscribeWs?.()
    this.unsubscribeStatus?.()
    this.awareness.destroy()
    this.connected = false
    this._synced = false
    this._handlers.clear()
  }
}
