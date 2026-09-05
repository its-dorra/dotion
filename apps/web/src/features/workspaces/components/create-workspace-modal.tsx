import { useIsMobile } from "@/lib/use-is-mobile";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { CreateWorkspaceDrawer } from "./create-workspace-drawer";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function CreateWorkspaceModal(props: CreateWorkspaceModalProps) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <CreateWorkspaceDrawer {...props} />
  ) : (
    <CreateWorkspaceDialog {...props} />
  );
}
