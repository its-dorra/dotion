import { CommentsContainer } from "./comments-container";
import type { PagePermissionRole } from "@/features/pages/types";

interface CommentsSidebarProps {
  pageId: string;
  currentUserRole: PagePermissionRole;
}

export function CommentsSidebar({
  pageId,
  currentUserRole,
}: CommentsSidebarProps) {
  return (
    <aside className="hidden w-80 shrink-0 border-l lg:block">
      <CommentsContainer pageId={pageId} currentUserRole={currentUserRole} />
    </aside>
  );
}
