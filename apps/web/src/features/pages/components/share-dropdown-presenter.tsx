import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { InviteToPageForm } from "./invite-to-page-form";
import { PublicSharing } from "./public-sharing";
import { PagePermissionRow } from "./page-permission-row";
import type { Page, PageMemberPermission, PagePermissionRole } from "../types";

interface ShareDropdownPresenterProps {
  page: Page;
  permissions: PageMemberPermission[];
  permissionsSlot?: React.ReactNode;
  canManage: boolean;
  onInvite: (email: string, role: PagePermissionRole) => void;
  isInviting: boolean;
  inviteErrorMessage?: string;
  onChangeRole: (userId: string, role: PagePermissionRole) => void;
  onTogglePublic: (isPublic: boolean) => void;
  isUpdatingPublic: boolean;
}

export function ShareDropdownPresenter({
  page,
  permissions,
  permissionsSlot,
  canManage,
  onInvite,
  isInviting,
  inviteErrorMessage,
  onChangeRole,
  onTogglePublic,
  isUpdatingPublic,
}: ShareDropdownPresenterProps) {
  const publicUrl = page.publicLinkSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${page.publicLinkSlug}`
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-3">
        {canManage ? (
          <>
            <InviteToPageForm
              onInvite={onInvite}
              isSubmitting={isInviting}
              errorMessage={inviteErrorMessage}
            />
            <DropdownMenuSeparator />
          </>
        ) : null}

        <PublicSharing
          isPublic={page.isPublic}
          publicUrl={publicUrl}
          onTogglePublic={onTogglePublic}
          isUpdating={isUpdatingPublic}
        />

        <DropdownMenuSeparator />

        <p className="px-0.5 py-1 text-xs font-medium text-muted-foreground">
          Who has access
        </p>
        {permissionsSlot ?? (
          <div className="divide-y">
            {permissions.map((permission) => (
              <PagePermissionRow
                key={permission.userId}
                permission={permission}
                canManage={canManage}
                onChangeRole={onChangeRole}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
