import { Result } from "better-result";
import { ValidationError, AppError } from "@/lib/errors";
import {
  PageNotFoundError,
  PageAlreadyInTrashError,
  PageMemberAlreadyExistsError,
  InsufficientPagePermissionError,
} from "./errors";
import type {
  Page,
  PageTreeNode,
  TrashedPage,
  PageMemberPermission,
  CreatePageInput,
  RenamePageInput,
  MoveToTrashInput,
  RestoreFromTrashInput,
  DeletePermanentlyInput,
  UpdatePagePermissionInput,
  InviteToPageInput,
  SetPagePublicInput,
  PageBreadcrumb,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Mock data store
// ---------------------------------------------------------------------------
// Stored as a flat record per workspace; the tree is derived in TypeScript
// from each node's parentId rather than fetched as a pre-built tree, per the
// "flat-fetch-then-build-in-TypeScript" approach.

interface InternalPage extends Omit<Page, "breadcrumbs" | "currentUserRole"> {
  permissions: PageMemberPermission[];
  deletedAt?: string;
  deletedByName?: string;
}

let mockPages: Record<string, InternalPage> = {
  page_root_1: {
    id: "page_root_1",
    workspaceId: "ws_1",
    parentId: null,
    title: "Getting Started",
    icon: "👋",
    isPublic: false,
    isInTrash: false,
    lastEditedAt: "2026-06-20T14:30:00.000Z",
    lastEditedByName: "Sam",
    createdAt: "2025-11-02T10:05:00.000Z",
    content: { type: "doc", blocks: [] },
    permissions: [
      {
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "editor",
      },
    ],
  },
  page_root_2: {
    id: "page_root_2",
    workspaceId: "ws_1",
    parentId: null,
    title: "Engineering",
    icon: "🛠️",
    isPublic: false,
    isInTrash: false,
    lastEditedAt: "2026-06-22T09:15:00.000Z",
    lastEditedByName: "Jordan Lee",
    createdAt: "2025-11-05T10:05:00.000Z",
    content: { type: "doc", blocks: [] },
    permissions: [
      {
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "editor",
      },
      {
        userId: "user_2",
        name: "Jordan Lee",
        email: "jordan@example.com",
        role: "editor",
      },
    ],
  },
  page_child_1: {
    id: "page_child_1",
    workspaceId: "ws_1",
    parentId: "page_root_2",
    title: "Architecture Decisions",
    icon: "📐",
    isPublic: false,
    isInTrash: false,
    lastEditedAt: "2026-06-23T11:00:00.000Z",
    lastEditedByName: "Sam",
    createdAt: "2025-12-01T10:05:00.000Z",
    content: { type: "doc", blocks: [] },
    permissions: [
      {
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "editor",
      },
    ],
  },
  page_child_2: {
    id: "page_child_2",
    workspaceId: "ws_1",
    parentId: "page_root_2",
    title: "On-call Runbook",
    icon: "🚨",
    isPublic: false,
    isInTrash: false,
    lastEditedAt: "2026-06-18T16:45:00.000Z",
    lastEditedByName: "Priya Shah",
    createdAt: "2026-01-10T10:05:00.000Z",
    content: { type: "doc", blocks: [] },
    permissions: [
      {
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "editor",
      },
      {
        userId: "user_3",
        name: "Priya Shah",
        email: "priya@example.com",
        role: "commenter",
      },
    ],
  },
  page_trashed_1: {
    id: "page_trashed_1",
    workspaceId: "ws_1",
    parentId: null,
    title: "Old Roadmap Draft",
    icon: "🗺️",
    isPublic: false,
    isInTrash: true,
    deletedAt: "2026-06-15T12:00:00.000Z",
    deletedByName: "Sam",
    lastEditedAt: "2026-06-10T08:00:00.000Z",
    lastEditedByName: "Sam",
    createdAt: "2026-02-01T10:05:00.000Z",
    content: { type: "doc", blocks: [] },
    permissions: [
      {
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "editor",
      },
    ],
  },
};

// "Current user" for permission resolution in this mock environment.
const CURRENT_USER_ID = "user_1";

function getCurrentUserRole(page: InternalPage) {
  return (
    page.permissions.find((p) => p.userId === CURRENT_USER_ID)?.role ??
    "viewer"
  );
}

function buildBreadcrumbs(pageId: string): PageBreadcrumb[] {
  const trail: PageBreadcrumb[] = [];
  let current: InternalPage | undefined = mockPages[pageId];

  while (current) {
    trail.unshift({ id: current.id, title: current.title, icon: current.icon });
    current = current.parentId ? mockPages[current.parentId] : undefined;
  }

  return trail;
}

function toPublicPage(internal: InternalPage): Page {
  return {
    id: internal.id,
    workspaceId: internal.workspaceId,
    parentId: internal.parentId,
    title: internal.title,
    icon: internal.icon,
    coverImageUrl: internal.coverImageUrl,
    isPublic: internal.isPublic,
    publicLinkSlug: internal.publicLinkSlug,
    isInTrash: internal.isInTrash,
    lastEditedAt: internal.lastEditedAt,
    lastEditedByName: internal.lastEditedByName,
    createdAt: internal.createdAt,
    currentUserRole: getCurrentUserRole(internal),
    breadcrumbs: buildBreadcrumbs(internal.id),
    content: internal.content,
  };
}

function hasChildren(pageId: string): boolean {
  return Object.values(mockPages).some(
    (p) => p.parentId === pageId && !p.isInTrash,
  );
}

export class PagesApi {
  /**
   * Returns the flat list of non-trashed pages for a workspace. Callers
   * build the nested tree client-side from each node's parentId.
   */
  async getPageTree(
    workspaceId: string,
  ): Promise<Result<PageTreeNode[], AppError>> {
    await delay(450);

    const nodes: PageTreeNode[] = Object.values(mockPages)
      .filter((p) => p.workspaceId === workspaceId && !p.isInTrash)
      .map((p) => ({
        id: p.id,
        title: p.title,
        icon: p.icon,
        parentId: p.parentId,
        workspaceId: p.workspaceId,
        hasChildren: hasChildren(p.id),
        isInTrash: p.isInTrash,
      }));

    return Result.ok(nodes);
  }

  async getPage(
    pageId: string,
  ): Promise<Result<Page, PageNotFoundError>> {
    await delay(400);

    const page = mockPages[pageId];
    if (!page || page.isInTrash) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist or has been deleted.",
          pageId,
        }),
      );
    }

    return Result.ok(toPublicPage(page));
  }

  async createPage(
    input: CreatePageInput,
  ): Promise<Result<Page, ValidationError>> {
    await delay(500);

    const id = generateId("page");
    const now = new Date().toISOString();

    const page: InternalPage = {
      id,
      workspaceId: input.workspaceId,
      parentId: input.parentId,
      title: input.title?.trim() || "Untitled",
      isPublic: false,
      isInTrash: false,
      lastEditedAt: now,
      lastEditedByName: "Sam",
      createdAt: now,
      content: { type: "doc", blocks: [] },
      permissions: [
        {
          userId: CURRENT_USER_ID,
          name: "Sam",
          email: "sam@example.com",
          role: "editor",
        },
      ],
    };

    mockPages = { ...mockPages, [id]: page };

    return Result.ok(toPublicPage(page));
  }

  async renamePage(
    input: RenamePageInput,
  ): Promise<Result<Page, PageNotFoundError | ValidationError>> {
    await delay(350);

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist or has been deleted.",
          pageId: input.pageId,
        }),
      );
    }

    const title = input.title.trim() || "Untitled";
    const updated: InternalPage = {
      ...page,
      title,
      lastEditedAt: new Date().toISOString(),
    };
    mockPages = { ...mockPages, [page.id]: updated };

    return Result.ok(toPublicPage(updated));
  }

  async moveToTrash(
    input: MoveToTrashInput,
  ): Promise<Result<true, PageNotFoundError | PageAlreadyInTrashError>> {
    await delay(400);

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }
    if (page.isInTrash) {
      return Result.err(
        new PageAlreadyInTrashError({
          message: "This page is already in the trash.",
          pageId: input.pageId,
        }),
      );
    }

    mockPages = {
      ...mockPages,
      [page.id]: {
        ...page,
        isInTrash: true,
        deletedAt: new Date().toISOString(),
        deletedByName: "Sam",
      },
    };

    return Result.ok(true);
  }

  async restoreFromTrash(
    input: RestoreFromTrashInput,
  ): Promise<Result<Page, PageNotFoundError>> {
    await delay(400);

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }

    const restored: InternalPage = {
      ...page,
      isInTrash: false,
      deletedAt: undefined,
      deletedByName: undefined,
    };
    mockPages = { ...mockPages, [page.id]: restored };

    return Result.ok(toPublicPage(restored));
  }

  async deletePermanently(
    input: DeletePermanentlyInput,
  ): Promise<Result<true, PageNotFoundError>> {
    await delay(450);

    if (!mockPages[input.pageId]) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }

    const { [input.pageId]: _removed, ...rest } = mockPages;
    mockPages = rest;

    return Result.ok(true);
  }

  async getTrashedPages(
    workspaceId: string,
  ): Promise<Result<TrashedPage[], AppError>> {
    await delay(400);

    const trashed: TrashedPage[] = Object.values(mockPages)
      .filter((p) => p.workspaceId === workspaceId && p.isInTrash)
      .map((p) => ({
        id: p.id,
        title: p.title,
        icon: p.icon,
        deletedAt: p.deletedAt ?? p.lastEditedAt,
        deletedByName: p.deletedByName ?? "Sam",
      }));

    return Result.ok(trashed);
  }

  async getPagePermissions(
    pageId: string,
  ): Promise<Result<PageMemberPermission[], PageNotFoundError>> {
    await delay(350);

    const page = mockPages[pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId,
        }),
      );
    }

    return Result.ok([...page.permissions]);
  }

  async inviteToPage(
    input: InviteToPageInput,
  ): Promise<
    Result<
      PageMemberPermission,
      | PageNotFoundError
      | ValidationError
      | PageMemberAlreadyExistsError
      | InsufficientPagePermissionError
    >
  > {
    await delay(500);

    if (input.actingUserRole !== "editor") {
      return Result.err(
        new InsufficientPagePermissionError({
          message: "Only editors can invite others to this page.",
          requiredRole: "editor",
        }),
      );
    }

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.email)) {
      return Result.err(
        new ValidationError({
          message: "Enter a valid email address.",
          field: "email",
        }),
      );
    }

    if (
      page.permissions.some(
        (p) => p.email.toLowerCase() === input.email.toLowerCase(),
      )
    ) {
      return Result.err(
        new PageMemberAlreadyExistsError({
          message: `${input.email} already has access to this page.`,
          email: input.email,
        }),
      );
    }

    const newPermission: PageMemberPermission = {
      userId: generateId("user"),
      name: input.email.split("@")[0],
      email: input.email,
      role: input.role,
    };

    mockPages = {
      ...mockPages,
      [page.id]: {
        ...page,
        permissions: [...page.permissions, newPermission],
      },
    };

    return Result.ok(newPermission);
  }

  async updatePagePermission(
    input: UpdatePagePermissionInput,
  ): Promise<
    Result<
      PageMemberPermission,
      PageNotFoundError | InsufficientPagePermissionError
    >
  > {
    await delay(400);

    if (input.actingUserRole !== "editor") {
      return Result.err(
        new InsufficientPagePermissionError({
          message: "Only editors can change page permissions.",
          requiredRole: "editor",
        }),
      );
    }

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }

    const updatedPermission: PageMemberPermission = {
      ...(page.permissions.find((p) => p.userId === input.userId) ?? {
        userId: input.userId,
        name: input.userId,
        email: "",
      }),
      role: input.role,
    };

    mockPages = {
      ...mockPages,
      [page.id]: {
        ...page,
        permissions: page.permissions.map((p) =>
          p.userId === input.userId ? updatedPermission : p,
        ),
      },
    };

    return Result.ok(updatedPermission);
  }

  async setPagePublic(
    input: SetPagePublicInput,
  ): Promise<Result<Page, PageNotFoundError>> {
    await delay(400);

    const page = mockPages[input.pageId];
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      );
    }

    const updated: InternalPage = {
      ...page,
      isPublic: input.isPublic,
      publicLinkSlug: input.isPublic
        ? page.publicLinkSlug ?? generateId("link")
        : page.publicLinkSlug,
    };
    mockPages = { ...mockPages, [page.id]: updated };

    return Result.ok(toPublicPage(updated));
  }
}

export const pagesApi = new PagesApi();
