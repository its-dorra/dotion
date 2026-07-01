import { createFileRoute } from "@tanstack/react-router";
import { ProfileContainer } from "@/features/user";

export const Route = createFileRoute("/app/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="h-full overflow-y-auto">
      <ProfileContainer />
    </div>
  );
}
