import type { AppDB, DBClient } from "../index";
import { comments } from "../schema";
import { and, count, eq, isNull } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError, NotFoundError } from "../errors";
import type { PageId } from "@dotion/shared/pages/types";
import type { UserId } from "@dotion/shared/users/types";
import type {
  Comment,
  CommentId,
  CommentWithRepliesAndAuthor,
} from "@dotion/shared/comments/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";

export class CommentsRepository {
  constructor(private readonly db: DBClient) {}

  async getPageComments(
    pageId: PageId,
    pagination: PaginationQuery,
  ): Promise<
    Result<PaginatedData<CommentWithRepliesAndAuthor>, DatabaseError>
  > {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const countQuery = this.db
        .select({ total: count() })
        .from(comments)
        .where(and(eq(comments.pageId, pageId), isNull(comments.parentId)));

      const rowsQuery = this.db.query.comments.findMany({
        where: {
          AND: [
            {
              pageId: {
                eq: pageId,
              },
            },
            {
              parentId: {
                isNull: true,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        limit: pagination.limit,
        offset,
        with: {
          author: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
            with: {
              author: {
                columns: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      const [[countResult], rootComments] = await Promise.all([
        countQuery,
        rowsQuery,
      ]);
      const total = Number(countResult?.total ?? 0);

      const hasMore = offset + rootComments.length < total;

      return Result.ok({
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          hasMore,
        },
        payload: rootComments as CommentWithRepliesAndAuthor[],
      });
    } catch (error) {
      console.error("CommentsRepository.getPageComments error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch comments" }),
      );
    }
  }

  async getCommentById(
    commentId: CommentId,
  ): Promise<
    Result<CommentWithRepliesAndAuthor, DatabaseError | NotFoundError>
  > {
    try {
      const comment = await this.db.query.comments.findFirst({
        where: {
          id: {
            eq: commentId,
          },
        },
        with: {
          author: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: "asc",
            },
            with: {
              author: {
                columns: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!comment) {
        return Result.err(new NotFoundError({ message: "Comment not found" }));
      }

      return Result.ok(comment as CommentWithRepliesAndAuthor);
    } catch (error) {
      console.error("CommentsRepository.getCommentById error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch comment" }),
      );
    }
  }

  async createComment(
    tx: AppDB,
    input: {
      pageId: PageId;
      authorId: UserId;
      body: string;
      parentId?: CommentId | null;
    },
  ): Promise<Result<Comment, DatabaseError>> {
    try {
      const [data] = await tx.insert(comments).values(input).returning({
        id: comments.id,
        pageId: comments.pageId,
        authorId: comments.authorId,
        parentId: comments.parentId,
        body: comments.body,
        isResolved: comments.isResolved,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      });
      if (!data) {
        return Result.err(
          new DatabaseError({ message: "Failed to create comment" }),
        );
      }
      return Result.ok(data);
    } catch (error) {
      console.error("CommentsRepository.createComment error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create comment" }),
      );
    }
  }

  async resolveComment(
    commentId: CommentId,
    tx: AppDB = this.db as unknown as AppDB,
  ): Promise<Result<boolean, DatabaseError>> {
    try {
      await tx
        .update(comments)
        .set({ isResolved: true })
        .where(eq(comments.id, commentId));
      return Result.ok(true);
    } catch (error) {
      console.error("CommentsRepository.resolveComment error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to resolve comment" }),
      );
    }
  }

  async deleteComment(
    commentId: CommentId,
    tx: AppDB = this.db as unknown as AppDB,
  ): Promise<
    Result<
      { commentId: CommentId; parentId: CommentId | null; isRoot: boolean },
      DatabaseError | NotFoundError
    >
  > {
    try {
      const [comment] = await tx
        .delete(comments)
        .where(eq(comments.id, commentId))
        .returning({
          id: comments.id,
          parentId: comments.parentId,
        });

      if (!comment) {
        return Result.err(new NotFoundError({ message: "Comment not found" }));
      }

      const isRoot = comment.parentId === null;

      return Result.ok({
        commentId: comment.id,
        parentId: comment.parentId,
        isRoot,
      });
    } catch (error) {
      console.error("CommentsRepository.deleteComment error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete comment" }),
      );
    }
  }
}
