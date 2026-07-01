import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { currentUserQueryOptions } from "../query-options";
import { useUpdateProfile } from "../hooks/use-update-profile";
import { ProfilePresenter } from "./profile-presenter";
import { ProfileLoading } from "./profile-loading";
import { ProfileError } from "./profile-error";

export function ProfileContainer() {
  const query = useQuery(currentUserQueryOptions());
  const updateProfile = useUpdateProfile();

  if (query.isPending) {
    return <ProfileLoading />;
  }

  if (query.isError) {
    return (
      <ProfileError
        message="Something went wrong loading your profile."
        onRetry={() => query.refetch()}
      />
    );
  }

  function handleSave(name: string) {
    updateProfile.mutate(
      { name },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <ProfilePresenter
      user={query.data}
      onSave={handleSave}
      isSaving={updateProfile.isPending}
      errorMessage={
        updateProfile.isError ? updateProfile.error.message : undefined
      }
    />
  );
}
