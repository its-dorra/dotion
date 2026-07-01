import { PageCover, AddCoverButton } from "./page-cover";
import { PageIconPicker } from "./page-icon-picker";
import { PageTitle } from "./page-title";
import type { Page } from "../types";

interface PageHeaderProps {
  page: Page;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string) => void;
  onCoverChange: () => void;
}

export function PageHeader({
  page,
  onTitleChange,
  onIconChange,
  onCoverChange,
}: PageHeaderProps) {
  const readOnly = page.currentUserRole !== "editor";

  return (
    <div className="group">
      <PageCover coverImageUrl={page.coverImageUrl} onChangeCover={onCoverChange} />
      <div className="mx-auto max-w-3xl px-12 pt-10">
        {!page.coverImageUrl ? (
          <div className="mb-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!readOnly ? <AddCoverButton onAddCover={onCoverChange} /> : null}
          </div>
        ) : null}
        {!readOnly ? (
          <PageIconPicker icon={page.icon} onChange={onIconChange} />
        ) : page.icon ? (
          <div className="flex h-16 w-16 items-center justify-center text-5xl leading-none">
            {page.icon}
          </div>
        ) : null}
        <div className="mt-2">
          <PageTitle
            title={page.title}
            onChange={onTitleChange}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
