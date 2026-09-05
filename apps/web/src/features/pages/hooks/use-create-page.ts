import { useMutation } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'

export function useCreatePage() {
  const navigate = useNavigate()

  return useMutation(
    resultMutationOptions({
      mutationFn: pagesApi.createPage,
      onSuccess: (page, vars) => {
        navigate({
          to: '/app/workspaces/$workspaceId/pages/$pageId',
          params: { workspaceId: vars.workspaceId, pageId: page.id },
        })
      },
      onError: (error) => {
        console.error('Error creating page:', error)
        toast.error(m.toast_page_create_failed())
      },
    }),
  )
}
