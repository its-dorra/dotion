import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTreeItem } from "./page-tree-item";
import type { PageTreeNodeWithChildren } from "../lib/build-page-tree";

interface PageTreePresenterProps {
  tree: PageTreeNodeWithChildren[];
  workspaceId: string;
  activePageId?: string;
  onCreateRootPage: () => void;
  onCreateChild: (parentId: string) => void;
  onMoveToTrash: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
}

export function PageTreePresenter({
  tree,
  workspaceId,
  activePageId,
  onCreateRootPage,
  onCreateChild,
  onMoveToTrash,
  onRenamePage,
}: PageTreePresenterProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground">
          Pages
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onCreateRootPage}
          aria-label="Add a page"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {tree.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          workspaceId={workspaceId}
          activePageId={activePageId}
          depth={0}
          onCreateChild={onCreateChild}
          onMoveToTrash={onMoveToTrash}
          onRenamePage={onRenamePage}
        />
      ))}
    </div>
  );
}
