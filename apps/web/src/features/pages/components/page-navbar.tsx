import { Breadcrumbs } from "./breadcrumbs";
import { LastEditedIndicator } from "./last-edited-indicator";
import { ShareDropdownContainer } from "./share-dropdown-container";
import type { Page } from "../types";

interface PageNavbarProps {
  page: Page;
  workspaceName: string;
  workspaceId: string;
  themeToggleSlot?: React.ReactNode;
}

export function PageNavbar({
  page,
  workspaceName,
  workspaceId,
  themeToggleSlot,
}: PageNavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
      <Breadcrumbs
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        breadcrumbs={page.breadcrumbs}
      />
      <div className="flex shrink-0 items-center gap-2">
        <LastEditedIndicator
          lastEditedAt={page.lastEditedAt}
          lastEditedByName={page.lastEditedByName}
        />
        <ShareDropdownContainer page={page} />
        {themeToggleSlot}
      </div>
    </header>
  );
}
