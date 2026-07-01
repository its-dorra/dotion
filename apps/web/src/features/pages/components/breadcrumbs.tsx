import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { PageBreadcrumb } from "../types";

interface BreadcrumbsProps {
  workspaceName: string;
  workspaceId: string;
  breadcrumbs: PageBreadcrumb[];
}

export function Breadcrumbs({
  workspaceName,
  workspaceId,
  breadcrumbs,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-muted-foreground"
    >
      <span className="shrink-0 truncate font-medium text-foreground">
        {workspaceName}
      </span>
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={crumb.id} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {isLast ? (
              <span className="truncate font-medium text-foreground">
                {crumb.icon ? `${crumb.icon} ` : ""}
                {crumb.title || "Untitled"}
              </span>
            ) : (
              <Link
                to="/app/workspaces/$workspaceId/pages/$pageId"
                params={{ workspaceId, pageId: crumb.id }}
                className="truncate hover:text-foreground"
              >
                {crumb.icon ? `${crumb.icon} ` : ""}
                {crumb.title || "Untitled"}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
