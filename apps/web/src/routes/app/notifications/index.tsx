import { createFileRoute } from "@tanstack/react-router";
import { NotificationsContainer } from "@/features/notifications";

export const Route = createFileRoute("/app/notifications/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Notifications
      </h1>
      <NotificationsContainer />
    </div>
  );
}
