import * as React from 'react'
import { useParams } from '@tanstack/react-router'
import { AiAssistantTrigger } from './ai-assistant-trigger'
import { AiAssistantDrawerPresenter } from './ai-assistant-drawer-presenter'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface AiAssistantContainerProps {
  workspaceId?: WorkspaceId
  pageId?: string
}

export function AiAssistantContainer({
  workspaceId: propWorkspaceId,
}: AiAssistantContainerProps) {
  const params = useParams({ strict: false })
  const workspaceId =
    propWorkspaceId ?? (params.workspaceId as WorkspaceId | undefined)
  const [open, setOpen] = React.useState(false)

  if (!workspaceId) return null

  return (
    <>
      <AiAssistantTrigger onClick={() => setOpen(true)} />
      <AiAssistantDrawerPresenter
        open={open}
        onOpenChange={setOpen}
        workspaceId={workspaceId}
      />
    </>
  )
}
