import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useTheme } from "@/components/common/theme-provider";

interface PageEditorProps {
  /**
   * BlockNote document JSON (the page's `content` field). Treated as
   * opaque initial content — BlockNote owns its in-memory state after
   * that. Render this component with `key={page.id}` from the parent so
   * switching pages remounts the editor with the new page's content,
   * since BlockNote only reads `initialContent` once on mount.
   */
  initialContent: unknown;
  readOnly: boolean;
  /**
   * Placeholder callback. Document changes will be wired to realtime
   * sync (Yjs/WebSockets) in a future pass — for now this is a no-op
   * the editor calls on every change so the contract is already in
   * place.
   */
  onDocumentChange: () => void;
}

function toInitialBlocks(content: unknown): PartialBlock[] | undefined {
  if (
    typeof content === "object" &&
    content !== null &&
    "blocks" in content &&
    Array.isArray((content as { blocks: unknown }).blocks) &&
    (content as { blocks: unknown[] }).blocks.length > 0
  ) {
    return (content as { blocks: PartialBlock[] }).blocks;
  }
  return undefined;
}

export function PageEditor({
  initialContent,
  readOnly,
  onDocumentChange,
}: PageEditorProps) {
  const { resolvedTheme } = useTheme();

  const editor = useCreateBlockNote({
    initialContent: toInitialBlocks(initialContent),
  });

  return (
    <div className="mx-auto max-w-3xl px-12 pb-32 pt-4">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        onChange={onDocumentChange}
        theme={resolvedTheme}
      />
    </div>
  );
}
