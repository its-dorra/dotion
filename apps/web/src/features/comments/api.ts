import { Result } from "better-result";
import { ValidationError, AppError } from "@/lib/errors";
import { ThreadNotFoundError, CommentNotFoundError, InsufficientCommentPermissionError } from "./errors";
import type {
  CommentThread,
  CreateCommentInput,
  ResolveThreadInput,
  DeleteCommentInput,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const CURRENT_USER = {
  userId: "user_1",
  name: "Sam",
};

let mockThreads: Record<string, CommentThread[]> = {
  page_child_2: [
    {
      id: "thread_1",
      pageId: "page_child_2",
      blockId: null,
      isResolved: false,
      comments: [
        {
          id: "comment_1",
          pageId: "page_child_2",
          blockId: null,
          threadId: "thread_1",
          author: { userId: "user_3", name: "Priya Shah" },
          body: "Should we add the rollback steps for the payments service here too?",
          createdAt: "2026-06-18T17:00:00.000Z",
          isResolved: false,
        },
        {
          id: "comment_2",
          pageId: "page_child_2",
          blockId: null,
          threadId: "thread_1",
          author: { userId: "user_1", name: "Sam" },
          body: "Good call — adding a section for that now.",
          createdAt: "2026-06-18T17:12:00.000Z",
          isResolved: false,
        },
      ],
    },
  ],
};

export class CommentsApi {
  async getThreads(
    pageId: string,
  ): Promise<Result<CommentThread[], AppError>> {
    await delay(400);
    return Result.ok([...(mockThreads[pageId] ?? [])]);
  }

  async createComment(
    input: CreateCommentInput,
  ): Promise<
    Result<
      CommentThread,
      ValidationError | ThreadNotFoundError | InsufficientCommentPermissionError
    >
  > {
    await delay(450);

    if (
      input.currentUserRole !== "commenter" &&
      input.currentUserRole !== "editor"
    ) {
      return Result.err(
        new InsufficientCommentPermissionError({
          message: "You need commenter or editor access to comment on this page.",
        }),
      );
    }

    if (!input.body.trim()) {
      return Result.err(
        new ValidationError({
          message: "Comment can't be empty.",
          field: "body",
        }),
      );
    }

    const pageThreads = mockThreads[input.pageId] ?? [];

    if (input.threadId) {
      const thread = pageThreads.find((t) => t.id === input.threadId);
      if (!thread) {
        return Result.err(
          new ThreadNotFoundError({
            message: "This comment thread no longer exists.",
            threadId: input.threadId,
          }),
        );
      }

      const updatedThread: CommentThread = {
        ...thread,
        comments: [
          ...thread.comments,
          {
            id: generateId("comment"),
            pageId: input.pageId,
            blockId: input.blockId,
            threadId: thread.id,
            author: CURRENT_USER,
            body: input.body.trim(),
            createdAt: new Date().toISOString(),
            isResolved: false,
          },
        ],
      };

      mockThreads = {
        ...mockThreads,
        [input.pageId]: pageThreads.map((t) =>
          t.id === thread.id ? updatedThread : t,
        ),
      };

      return Result.ok(updatedThread);
    }

    const newThread: CommentThread = {
      id: generateId("thread"),
      pageId: input.pageId,
      blockId: input.blockId,
      isResolved: false,
      comments: [
        {
          id: generateId("comment"),
          pageId: input.pageId,
          blockId: input.blockId,
          threadId: "",
          author: CURRENT_USER,
          body: input.body.trim(),
          createdAt: new Date().toISOString(),
          isResolved: false,
        },
      ],
    };
    newThread.comments[0].threadId = newThread.id;

    mockThreads = {
      ...mockThreads,
      [input.pageId]: [...pageThreads, newThread],
    };

    return Result.ok(newThread);
  }

  async resolveThread(
    input: ResolveThreadInput,
  ): Promise<Result<CommentThread, ThreadNotFoundError>> {
    await delay(350);

    for (const [pageId, threads] of Object.entries(mockThreads)) {
      const thread = threads.find((t) => t.id === input.threadId);
      if (thread) {
        const updated: CommentThread = { ...thread, isResolved: true };
        mockThreads = {
          ...mockThreads,
          [pageId]: threads.map((t) => (t.id === thread.id ? updated : t)),
        };
        return Result.ok(updated);
      }
    }

    return Result.err(
      new ThreadNotFoundError({
        message: "This comment thread no longer exists.",
        threadId: input.threadId,
      }),
    );
  }

  async deleteComment(
    input: DeleteCommentInput,
  ): Promise<Result<true, CommentNotFoundError>> {
    await delay(350);

    for (const [pageId, threads] of Object.entries(mockThreads)) {
      let found = false;
      const updatedThreads = threads
        .map((thread) => {
          if (!thread.comments.some((c) => c.id === input.commentId)) {
            return thread;
          }
          found = true;
          return {
            ...thread,
            comments: thread.comments.filter(
              (c) => c.id !== input.commentId,
            ),
          };
        })
        .filter((thread) => thread.comments.length > 0);

      if (found) {
        mockThreads = { ...mockThreads, [pageId]: updatedThreads };
        return Result.ok(true);
      }
    }

    return Result.err(
      new CommentNotFoundError({
        message: "This comment no longer exists.",
        commentId: input.commentId,
      }),
    );
  }
}

export const commentsApi = new CommentsApi();
