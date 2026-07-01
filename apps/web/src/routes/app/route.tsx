import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AiAssistantContainer } from "@/features/ai-assistant";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  // pageId is only present on the page detail route; the assistant only
  // makes sense there, so it renders conditionally rather than the sidebar
  // needing to know about it.
  const params = useParams({ strict: false });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      {params.pageId ? <AiAssistantContainer pageId={params.pageId} /> : null}
    </div>
  );
}
