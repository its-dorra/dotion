import { PageNavbar } from "./page-navbar";
import { PageHeader } from "./page-header";
import { PageEditor } from "./page-editor";
import type { Page } from "../types";

interface PageDetailPresenterProps {
  page: Page;
  workspaceName: string;
  workspaceId: string;
  themeToggleSlot?: React.ReactNode;
  commentsSlot?: React.ReactNode;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string) => void;
  onCoverChange: () => void;
  onDocumentChange: () => void;
}

export function PageDetailPresenter({
  page,
  workspaceName,
  workspaceId,
  themeToggleSlot,
  commentsSlot,
  onTitleChange,
  onIconChange,
  onCoverChange,
  onDocumentChange,
}: PageDetailPresenterProps) {
  return (
    <div className="flex h-full flex-col">
      <PageNavbar
        page={page}
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        themeToggleSlot={themeToggleSlot}
      />
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex-1">
          <PageHeader
            page={page}
            onTitleChange={onTitleChange}
            onIconChange={onIconChange}
            onCoverChange={onCoverChange}
          />
          <PageEditor
            key={page.id}
            initialContent={page.content}
            readOnly={page.currentUserRole !== "editor"}
            onDocumentChange={onDocumentChange}
          />
        </div>
        {commentsSlot}
      </div>
    </div>
  );
}
