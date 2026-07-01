import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, MoreHorizontal, Plus, Trash2, FileText, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageTreeNodeWithChildren } from "../lib/build-page-tree";

interface PageTreeItemProps {
  node: PageTreeNodeWithChildren;
  workspaceId: string;
  activePageId?: string;
  depth: number;
  onCreateChild: (parentId: string) => void;
  onMoveToTrash: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
}

export function PageTreeItem({
  node,
  workspaceId,
  activePageId,
  depth,
  onCreateChild,
  onMoveToTrash,
  onRenamePage,
}: PageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const isActive = node.id === activePageId;
  const showChildren = isExpanded && node.children.length > 0;

  function startRenaming() {
    setRenameValue(node.title);
    setIsRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.title) {
      onRenamePage(node.id, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pr-1 text-sm hover:bg-accent",
          isActive && "bg-accent",
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted",
            node.children.length === 0 && "invisible",
          )}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")}
          />
        </button>

        {isRenaming ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {node.icon ? (
              <span className="shrink-0 leading-none">{node.icon}</span>
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === "Escape") {
                  setIsRenaming(false);
                }
              }}
              className="h-6 px-1 py-0 text-sm"
            />
          </div>
        ) : (
          <Link
            to="/app/workspaces/$workspaceId/pages/$pageId"
            params={{ workspaceId, pageId: node.id }}
            className="flex min-w-0 flex-1 items-center gap-1.5 truncate"
          >
            {node.icon ? (
              <span className="shrink-0 leading-none">{node.icon}</span>
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{node.title || "Untitled"}</span>
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(event) => {
              event.preventDefault();
              onCreateChild(node.id);
            }}
            aria-label="Add a page inside"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                aria-label="Page options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={startRenaming}>
                <Pencil className="h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => onMoveToTrash(node.id)}
              >
                <Trash2 className="h-4 w-4" />
                Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showChildren ? (
        <div>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              workspaceId={workspaceId}
              activePageId={activePageId}
              depth={depth + 1}
              onCreateChild={onCreateChild}
              onMoveToTrash={onMoveToTrash}
              onRenamePage={onRenamePage}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
