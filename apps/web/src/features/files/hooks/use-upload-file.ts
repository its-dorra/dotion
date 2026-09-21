import { useMutation } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { filesApi } from '../api'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'

export function useUploadFile() {
  return useMutation(
    resultMutationOptions({
      mutationFn: filesApi.uploadFile,
      onError: (error) => {
        toast.error(m.toast_file_upload_failed())
      },
    }),
  )
}
