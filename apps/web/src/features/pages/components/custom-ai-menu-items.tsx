import type { BlockNoteEditor } from '@blocknote/core'
import {
  AIExtension,
  AIMenu,
  getDefaultAIMenuItems,
  aiDocumentFormats,
  type AIMenuSuggestionItem,
} from '@blocknote/xl-ai'
import {
  Sparkles,
  Languages,
  CheckCheck,
  Minimize2,
  Maximize2,
  FileText,
  HelpCircle,
  Smile,
  Briefcase,
  Lightbulb,
  PenTool,
} from 'lucide-react'
import { getLocale } from '@/paraglide/runtime'

export function createCustomAIMenuItems(
  editor: BlockNoteEditor,
  locale: string,
): {
  selectionItems: AIMenuSuggestionItem[]
  generalItems: AIMenuSuggestionItem[]
} {
  const isAr = locale === 'ar'
  const isFr = locale === 'fr'

  async function invokeEditorAI(options: {
    userPrompt: string
    useSelection: boolean
    tools: { add: boolean; delete: boolean; update: boolean }
  }) {
    const ai = editor.getExtension(AIExtension)
    if (!ai) return

    await ai.invokeAI({
      userPrompt: options.userPrompt,
      useSelection: options.useSelection,
      streamToolsProvider: aiDocumentFormats.html.getStreamToolsProvider({
        defaultStreamTools: options.tools,
      }),
    })
  }

  // Translation commands (Arabic, French, English)
  const translateToArabic: AIMenuSuggestionItem = {
    key: 'translate_ar',
    title: isAr
      ? 'ترجمة إلى العربية'
      : isFr
        ? 'Traduire en arabe'
        : 'Translate to Arabic',
    aliases: ['arabic', 'arabe', 'عربي', 'ترجمة'],
    icon: <Languages className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Translate the selected text accurately into modern standard Arabic (العربية). Maintain all structure and tone.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const translateToFrench: AIMenuSuggestionItem = {
    key: 'translate_fr',
    title: isAr
      ? 'ترجمة إلى الفرنسية'
      : isFr
        ? 'Traduire en français'
        : 'Translate to French',
    aliases: ['french', 'francais', 'français', 'فرنسي'],
    icon: <Languages className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Translate the selected text accurately into French (Français). Maintain all formatting and natural phrasing.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const translateToEnglish: AIMenuSuggestionItem = {
    key: 'translate_en',
    title: isAr
      ? 'ترجمة إلى الإنجليزية'
      : isFr
        ? 'Traduire en anglais'
        : 'Translate to English',
    aliases: ['english', 'anglais', 'انجليزي', 'إنجليزي'],
    icon: <Languages className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Translate the selected text accurately into clear and natural English. Maintain all formatting.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  // Selection edits
  const improveWriting: AIMenuSuggestionItem = {
    key: 'improve_writing',
    title: isAr
      ? 'تحسين الصياغة'
      : isFr
        ? 'Améliorer le texte'
        : 'Improve writing',
    aliases: ['improve', 'better', 'ameliorer', 'تحسين'],
    icon: <Sparkles className="h-4 w-4 text-primary" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Improve the writing quality, clarity, and flow of the selected text while preserving its core meaning.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const fixSpellingGrammar: AIMenuSuggestionItem = {
    key: 'fix_spelling_grammar',
    title: isAr
      ? 'تصحيح الإملاء والقواعد'
      : isFr
        ? "Corriger l'orthographe"
        : 'Fix spelling & grammar',
    aliases: ['grammar', 'spelling', 'correct', 'orthographe', 'تدقيق'],
    icon: <CheckCheck className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Fix all spelling, typographical, and grammatical mistakes in the selected text without altering its meaning.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const makeShorter: AIMenuSuggestionItem = {
    key: 'make_shorter',
    title: isAr ? 'تقصير النص' : isFr ? 'Raccourcir' : 'Make shorter',
    aliases: ['shorten', 'brief', 'concise', 'raccourcir', 'تقصير'],
    icon: <Minimize2 className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Make the selected text more concise and succinct while keeping the critical points.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const makeLonger: AIMenuSuggestionItem = {
    key: 'make_long',
    title: isAr ? 'إطالة وتفصيل' : isFr ? 'Développer' : 'Make longer',
    aliases: ['expand', 'longer', 'elaborate', 'developper', 'توسيع'],
    icon: <Maximize2 className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Elaborate and expand upon the selected text with descriptive context and helpful details.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const changeToneCasual: AIMenuSuggestionItem = {
    key: 'tone_casual',
    title: isAr
      ? 'نبرة غير رسمية (عفوية)'
      : isFr
        ? 'Ton : Décontracté'
        : 'Tone: Casual',
    aliases: ['casual', 'informal', 'decontracte', 'عفوي'],
    icon: <Smile className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Rewrite the selected text with a friendly, casual, and conversational tone.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const changeToneFormal: AIMenuSuggestionItem = {
    key: 'tone_formal',
    title: isAr
      ? 'نبرة رسمية ومهنية'
      : isFr
        ? 'Ton : Professionnel'
        : 'Tone: Formal / Professional',
    aliases: ['formal', 'professional', 'professionnel', 'رسمي'],
    icon: <Briefcase className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Rewrite the selected text with a polished, professional, and formal tone suitable for business documentation.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const summarizeSelection: AIMenuSuggestionItem = {
    key: 'summarize_selection',
    title: isAr ? 'تلخيص المحدد' : isFr ? 'Résumer la sélection' : 'Summarize',
    aliases: ['summary', 'summarize', 'resumer', 'تلخيص'],
    icon: <FileText className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Provide a clear, high-level summary of the selected content.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  const explainSelection: AIMenuSuggestionItem = {
    key: 'explain_selection',
    title: isAr ? 'شرح المحتوى' : isFr ? 'Expliquer' : 'Explain selection',
    aliases: ['explain', 'expliquer', 'شرح'],
    icon: <HelpCircle className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Explain the concepts, background, or meaning of the selected text simply and clearly.',
        useSelection: true,
        tools: { add: false, delete: false, update: true },
      })
    },
  }

  // Non-selection / General items (brainstorming, writing)
  const brainstormIdeas: AIMenuSuggestionItem = {
    key: 'brainstorm_ideas',
    title: isAr
      ? 'عصف ذهني وأفكار'
      : isFr
        ? "Remue-méninges d'idées"
        : 'Brainstorm ideas',
    aliases: ['brainstorm', 'ideas', 'idees', 'افكار', 'أفكار'],
    icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Brainstorm a structured list of creative ideas and action points related to this document context.',
        useSelection: false,
        tools: { add: true, delete: false, update: false },
      })
    },
  }

  const continueWriting: AIMenuSuggestionItem = {
    key: 'continue_writing',
    title: isAr
      ? 'متابعة الكتابة'
      : isFr
        ? "Continuer l'écriture"
        : 'Continue writing',
    aliases: ['continue', 'continuer', 'متابعة'],
    icon: <PenTool className="h-4 w-4" />,
    size: 'small',
    onItemClick: async () => {
      await invokeEditorAI({
        userPrompt:
          'Continue writing seamless next paragraphs and sections building upon the current document context.',
        useSelection: false,
        tools: { add: true, delete: false, update: false },
      })
    },
  }

  const selectionItems: AIMenuSuggestionItem[] = [
    improveWriting,
    fixSpellingGrammar,
    makeShorter,
    makeLonger,
    changeToneCasual,
    changeToneFormal,
    translateToArabic,
    translateToFrench,
    translateToEnglish,
    summarizeSelection,
    explainSelection,
  ]

  const generalItems: AIMenuSuggestionItem[] = [
    brainstormIdeas,
    continueWriting,
  ]

  return { selectionItems, generalItems }
}

export function CustomAIMenu() {
  const locale = getLocale()

  return (
    <AIMenu
      items={(
        editor: BlockNoteEditor,
        aiResponseStatus:
          | 'user-input'
          | 'thinking'
          | 'ai-writing'
          | 'error'
          | 'user-reviewing'
          | 'closed',
      ) => {
        if (aiResponseStatus === 'user-input') {
          const { selectionItems, generalItems } = createCustomAIMenuItems(
            editor,
            locale,
          )

          if (editor.getSelection()) {
            return [
              ...getDefaultAIMenuItems(editor, aiResponseStatus),
              ...selectionItems,
            ]
          }

          return [
            ...getDefaultAIMenuItems(editor, aiResponseStatus),
            ...generalItems,
          ]
        }

        return getDefaultAIMenuItems(editor, aiResponseStatus)
      }}
    />
  )
}
