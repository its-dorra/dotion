import type { PageTreeNode } from '@dotion/shared/pages/types'
import type { TrashedPage } from '../types'

export interface PageTreeNodeWithChildren extends PageTreeNode {
  children: PageTreeNodeWithChildren[]
}

export interface TrashedPageTreeNode extends TrashedPage {
  children: TrashedPageTreeNode[]
}

export function buildTrashTree(pages: TrashedPage[]): TrashedPageTreeNode[] {
  const byId = new Map<string, TrashedPageTreeNode>()

  for (const page of pages) {
    byId.set(page.id, { ...page, children: [] })
  }

  const roots: TrashedPageTreeNode[] = []

  for (const page of byId.values()) {
    if (page.parentId && byId.has(page.parentId)) {
      byId.get(page.parentId)!.children.push(page)
    } else {
      roots.push(page)
    }
  }

  return roots
}

export function buildPageTree(
  nodes: PageTreeNode[],
): PageTreeNodeWithChildren[] {
  const byId = new Map<string, PageTreeNodeWithChildren>()

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] })
  }

  const roots: PageTreeNodeWithChildren[] = []

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function hasDescendant(
  node: PageTreeNodeWithChildren,
  pageId: string,
): boolean {
  for (const child of node.children) {
    if (child.id === pageId || hasDescendant(child, pageId)) return true
  }
  return false
}
