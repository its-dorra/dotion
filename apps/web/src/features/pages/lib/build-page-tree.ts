import type { PageTreeNode } from "../types";

export interface PageTreeNodeWithChildren extends PageTreeNode {
  children: PageTreeNodeWithChildren[];
}

/**
 * Builds a nested tree from the flat, parentId-based list returned by the
 * API. Pages whose parent isn't present in the list (e.g. it's been
 * filtered out) are treated as root nodes, so nothing silently disappears.
 */
export function buildPageTree(
  nodes: PageTreeNode[],
): PageTreeNodeWithChildren[] {
  const byId = new Map<string, PageTreeNodeWithChildren>();

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: PageTreeNodeWithChildren[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
