import type { DBClient } from "@dotion/db";
import { DatabaseError, NotFoundError } from "@dotion/db";
import type { CommentsRepository } from "@dotion/db/repositories";
import type { UserId } from "@dotion/shared/users/types";
import type { PageId } from "@dotion/shared/pages/types";
import { Result } from "better-result";
import type {
  CommentId,
  CommentWithRepliesAndAuthor,
} from "@dotion/shared/comments/types";
import type { PaginationQuery } from "@dotion/shared/pagination/types";
import type { PagesService } from "./pages.service";
import type { PageEventPublisher } from "./realtime.types";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly pagesService: PagesService,
    private readonly dbClient: DBClient,
    private readonly pageEventPublisher?: PageEventPublisher,
  ) {}

  async getPageComments(pageId: PageId, pagination: PaginationQuery) {
    return this.commentsRepository.getPageComments(pageId, pagination);
  }

  async getCommentById(commentId: CommentId) {
    return this.commentsRepository.getCommentById(commentId);
  }

  async createComment(
    userId: UserId,
    input: {
      pageId: PageId;
      body: string;
      parentId?: CommentId | null;
    },
  ): Promise<
    Result<CommentWithRepliesAndAuthor, DatabaseError | NotFoundError>
  > {
    const result = await this.commentsRepository
      .createComment(this.dbClient, {
        pageId: input.pageId,
        authorId: userId,
        body: input.body,
        parentId: input.parentId ?? null,
      })
      .then(
        Result.andThenAsync((comment) => {
          const rootId = (comment.parentId ?? comment.id) as CommentId;
          return this.commentsRepository.getCommentById(rootId);
        }),
      );

    if (result.isOk()) {
      await this.pageEventPublisher?.broadcastCommentCreated(
        input.pageId,
        result.value,
      );
    }

    return result;
  }

  async resolveComment(pageId: PageId, commentId: CommentId) {
    const result = await this.commentsRepository.resolveComment(commentId);
    if (result.isOk()) {
      await this.pageEventPublisher?.broadcastCommentResolved(
        pageId,
        commentId,
      );
    }
    return result;
  }

  async deleteComment(pageId: PageId, commentId: CommentId) {
    const result = await this.commentsRepository.deleteComment(commentId);
    if (result.isOk()) {
      await this.pageEventPublisher?.broadcastCommentDeleted(
        pageId,
        result.value,
      );
    }
    return result;
  }

  // --- Authorization Attribute Loaders ---

  async loadCommentResourceData({
    commentId,
    userId,
  }: {
    commentId: CommentId;
    userId: UserId;
  }): Promise<Result<ResourceData<"comment"> | null, DatabaseError>> {
    return Result.gen(async function* (this: CommentsService) {
      const comment = yield* Result.await(
        this.commentsRepository
          .getCommentById(commentId)
          .then(
            Result.tryRecover((error: DatabaseError | NotFoundError) =>
              error._tag === "NotFoundError"
                ? Result.ok(null)
                : Result.err(error),
            ),
          ),
      );
      if (!comment) return Result.ok(null);

      const pageData = yield* Result.await(
        this.pagesService.loadPageResourceData({
          pageId: comment.pageId,
          userId,
        }),
      );
      if (!pageData) return Result.ok(null);

      return Result.ok({
        commentId,
        pageId: comment.pageId,
        workspaceId: pageData.workspaceId,
        authorId: comment.authorId,
        userWorkspaceRole: pageData.userWorkspaceRole,
        userPageRole: pageData.userPageRole,
      });
    }, this);
  }

  async loadCommentScopeData({
    pageId,
    userId,
  }: {
    pageId?: PageId;
    userId: UserId;
  }): Promise<Result<ScopeData<"comment"> | null, DatabaseError>> {
    if (!pageId) {
      return Result.ok({
        pageId: "" as PageId,
        workspaceId: "" as any,
        userWorkspaceRole: null,
        userPageRole: null,
      });
    }

    return this.pagesService.loadPageResourceData({ pageId, userId }).then(
      Result.map((pageData) => ({
        pageId,
        workspaceId: pageData?.workspaceId ?? ("" as any),
        userWorkspaceRole: pageData?.userWorkspaceRole ?? null,
        userPageRole: pageData?.userPageRole ?? null,
      })),
    );
  }
}
