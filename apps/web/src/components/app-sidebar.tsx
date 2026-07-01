import { useState } from "react";
import { useParams, useMatchRoute } from "@tanstack/react-router";
import { Home, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceSwitcherContainer } from "@/features/workspaces";
import { UserMenuContainer } from "@/features/user";
import { NotificationsContainer, notificationsListQueryOptions } from "@/features/notifications";
import { SidebarNavButton } from "./sidebar-nav-button";
import { HomePanel } from "./home-panel";

type SidebarPanel = "home" | "notifications";

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const params = useParams({ strict: false });

  // The route may not have a workspaceId (e.g. /app/notifications,
  // /app/profile). The switcher resolves a real workspace either way
  // (falling back to the user's first one) and reports it back here so
  // the rest of the sidebar — Home panel, user menu — has one to use.
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<
    string | undefined
  >(params.workspaceId);

  const isTrashRoute = Boolean(
    matchRoute({ to: "/app/workspaces/$workspaceId/trash", fuzzy: false }),
  );
  const isNotificationsRoute = Boolean(
    matchRoute({ to: "/app/notifications", fuzzy: false }),
  );

  const [panel, setPanel] = useState<SidebarPanel>(
    isNotificationsRoute ? "notifications" : "home",
  );

  // Cheap unread check for the sidebar badge; the notifications panel/route
  // own their own loading and error states independently of this indicator.
  const notificationsQuery = useQuery(notificationsListQueryOptions());
  const hasUnread = notificationsQuery.data?.some((n) => !n.isRead) ?? false;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r">
      <div className="p-2">
        <UserMenuContainer currentWorkspaceId={resolvedWorkspaceId} />
      </div>
      <div className="px-2">
        <WorkspaceSwitcherContainer
          currentWorkspaceId={params.workspaceId}
          onResolveWorkspace={setResolvedWorkspaceId}
        />
      </div>

      <nav className="flex gap-1 px-2 pt-3">
        <SidebarNavButton
          icon={Home}
          label="Home"
          isActive={panel === "home"}
          onClick={() => setPanel("home")}
        />
        <SidebarNavButton
          icon={Bell}
          label="Notifications"
          isActive={panel === "notifications"}
          onClick={() => setPanel("notifications")}
          badge={hasUnread}
        />
      </nav>

      <div className="mt-2 flex flex-1 flex-col overflow-hidden">
        {panel === "home" ? (
          resolvedWorkspaceId ? (
            <HomePanel
              workspaceId={resolvedWorkspaceId}
              activePageId={params.pageId}
              isTrashActive={isTrashRoute}
            />
          ) : null
        ) : (
          <div className="flex-1 overflow-y-auto px-1 py-2">
            <NotificationsContainer />
          </div>
        )}
      </div>
    </aside>
  );
}
