import { useMutation } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { filesApi } from '../api'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@/features/pages/types'

export interface UploadFileInput {
  workspaceId: WorkspaceId
  pageId: PageId
  file: File
}

export function useUploadFile() {
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UploadFileInput) => filesApi.uploadFile(input),
      onError: (error) => {
        console.error('Error uploading file:', error)
        toast.error(m.toast_file_upload_failed())
      },
    }),
  )
}
