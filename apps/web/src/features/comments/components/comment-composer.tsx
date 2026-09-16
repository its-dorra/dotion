import { useState, type FormEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateComment } from '../hooks/use-create-comment'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import type { CommentId } from '@dotion/shared/comments/types'

interface CommentComposerProps {
  workspaceId: WorkspaceId
  pageId: PageId
  parentId?: CommentId
  placeholder?: string
  onSuccess?: () => void
  autoFocus?: boolean
}

export function CommentComposer({
  workspaceId,
  pageId,
  parentId,
  placeholder = m.comments_placeholder(),
  onSuccess,
  autoFocus = false,
}: CommentComposerProps) {
  const [value, setValue] = useState('')
  const createComment = useCreateComment()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    await createComment.mutateAsync({
      workspaceId,
      pageId,
      parentId,
      body: trimmed,
    })
    setValue('')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        rows={1}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSubmit(event)
          }
        }}
        className="flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button
        type="submit"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={createComment.isPending || !value.trim()}
        aria-label="Send comment"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  )
}
