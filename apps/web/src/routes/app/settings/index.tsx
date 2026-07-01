import { createFileRoute } from "@tanstack/react-router";
import { SettingsPresenter } from "@/features/user";

export const Route = createFileRoute("/app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <SettingsPresenter />
    </div>
  );
}
