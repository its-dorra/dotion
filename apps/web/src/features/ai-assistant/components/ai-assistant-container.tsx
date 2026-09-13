import * as React from 'react'
import { AiAssistantTrigger } from './ai-assistant-trigger'
import { AiAssistantDrawerPresenter } from './ai-assistant-drawer-presenter'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface AiAssistantContainerProps {
  workspaceId: WorkspaceId
}

export function AiAssistantContainer({
  workspaceId,
}: AiAssistantContainerProps) {
  const [open, setOpen] = React.useState(false)

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
