import { PageCover, AddCoverButton } from './page-cover'
import { PageIconPicker, AddIconButton } from './page-icon-picker'
import { PageTitle } from './page-title'
import type { Page } from '../types'

interface PageHeaderProps {
  page: Page
  onTitleChange: (title: string) => void
  onIconChange: (icon: string | null) => void
  onCoverChange: (cover: string | null) => void
  readOnly?: boolean
}

export function PageHeader({
  page,
  onTitleChange,
  onIconChange,
  onCoverChange,
  readOnly = false,
}: PageHeaderProps) {
  const hasCover = Boolean(page.cover)
  const hasIcon = Boolean(page.icon)

  return (
    <div className="group relative">
      <PageCover
        cover={page.cover}
        onChangeCover={(cover) => onCoverChange(cover)}
        readOnly={readOnly}
      />

      <div
        className={`mx-auto max-w-3xl px-4 sm:px-12 ${hasCover ? 'pt-0' : 'pt-6 sm:pt-12'}`}
      >
        {!readOnly && (!hasIcon || !hasCover) ? (
          <div
            className={`flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100 ${
              hasCover ? 'pt-2 pb-1' : 'mb-2'
            }`}
          >
            {!hasIcon && (
              <AddIconButton onAddIcon={(icon) => onIconChange(icon)} />
            )}
            {!hasCover && (
              <AddCoverButton onAddCover={(cover) => onCoverChange(cover)} />
            )}
          </div>
        ) : null}

        {hasIcon ? (
          <div
            className={
              hasCover
                ? '-mt-10 mb-2 relative z-10 inline-block'
                : 'mb-2 inline-block'
            }
          >
            <PageIconPicker
              icon={page.icon}
              onChange={(icon) => onIconChange?.(icon)}
              readOnly={readOnly}
            />
          </div>
        ) : null}

        <div className="mt-1">
          <PageTitle
            title={page.title}
            onChange={(title) => onTitleChange?.(title)}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  )
}
