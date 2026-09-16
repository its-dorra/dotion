import { useMemo, useCallback, memo } from 'react'
import type { BlockNoteEditor } from '@blocknote/core'
import {
  useCreateBlockNote,
  FormattingToolbar,
  FormattingToolbarController,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
} from '@blocknote/react'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { BlockNoteView } from '@blocknote/shadcn'
import { withCollaboration } from '@blocknote/core/yjs'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/shadcn/style.css'
import '@blocknote/xl-ai/style.css'
import {
  AIExtension,
  AIMenuController,
  AIToolbarButton,
  getAISlashMenuItems,
} from '@blocknote/xl-ai'
import { DefaultChatTransport } from 'ai'
import { useTheme } from '@/components/common/theme-provider'
import { useSession } from '@/features/auth/hooks/use-session'
import { generateUserColor } from '../lib/user-colors'
import type { PageYjsProvider } from '../lib/page-yjs-provider'
import * as locales from '@blocknote/core/locales'
import * as aiLocales from '@blocknote/xl-ai/locales'
import { getLocale } from '@/paraglide/runtime'

import { useUploadFile } from '@/features/files/hooks/use-upload-file'
import { filesApi } from '@/features/files/api'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '../types'
import { CustomAIMenu } from './custom-ai-menu-items'

interface PageEditorProps {
  workspaceId: WorkspaceId
  pageId: PageId
  readOnly: boolean

  collaborationProvider: PageYjsProvider
}

const FormattingToolbarWithAI = () => (
  <FormattingToolbar>
    {...getFormattingToolbarItems()}
    <AIToolbarButton />
  </FormattingToolbar>
)

export const PageEditor = memo(function PageEditor({
  workspaceId,
  pageId,
  readOnly,
  collaborationProvider,
}: PageEditorProps) {
  const { resolvedTheme } = useTheme()
  const { data: session } = useSession()
  const uploadFileMutation = useUploadFile()
  const currentLocale = getLocale()

  const dictionary = useMemo(() => {
    const baseLocale =
      locales[currentLocale as keyof typeof locales] ?? locales.en
    const aiLocale =
      aiLocales[currentLocale as keyof typeof aiLocales] ?? aiLocales.en

    return {
      ...baseLocale,
      ai: aiLocale,
    }
  }, [currentLocale])

  const extensions = useMemo(() => {
    return [
      AIExtension({
        transport: new DefaultChatTransport({
          api: `/api/v1/workspaces/${workspaceId}/pages/${pageId}/ai/streamText`,
        }) as unknown as NonNullable<
          Parameters<typeof AIExtension>[0]
        >['transport'],
      }),
    ]
  }, [workspaceId, pageId])

  const editor = useCreateBlockNote(
    withCollaboration({
      collaboration: {
        fragment: collaborationProvider.doc.getXmlFragment('document-store'),

        user: {
          name: session?.user?.name ?? 'Anonymous',
          color: session?.user?.id
            ? generateUserColor(session.user.id)
            : '#808080',
        },
        provider: collaborationProvider,
      },
      uploadFile: async (file: File) => {
        const result = await uploadFileMutation.mutateAsync({
          workspaceId,
          pageId,
          file,
        })
        return result.url
      },
      resolveFileUrl: async (url: string) => {
        return filesApi.resolveFileUrl(url)
      },
      dictionary,
      extensions,
    }),
    [workspaceId, pageId],
  )

  const getSlashMenuItems = useCallback(
    (editorInstance: BlockNoteEditor) => [
      ...getDefaultReactSlashMenuItems(editorInstance),
      ...(readOnly ? [] : getAISlashMenuItems(editorInstance)),
    ],
    [readOnly],
  )

  const getItems = useCallback(
    async (query: string) =>
      filterSuggestionItems(getSlashMenuItems(editor), query),
    [editor, getSlashMenuItems],
  )

  return (
    <div className="mx-auto max-w-3xl px-12 pb-32 pt-4">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme={resolvedTheme}
        formattingToolbar={false}
        slashMenu={false}
      >
        {!readOnly && (
          <>
            <AIMenuController aiMenu={CustomAIMenu} />
            <FormattingToolbarController
              formattingToolbar={FormattingToolbarWithAI}
            />
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getItems}
            />
          </>
        )}
      </BlockNoteView>
    </div>
  )
})
