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
import type { DomainEventDispatcher } from "./event-dispatcher.types";
import type { OutboxService } from "./outbox.service";
import type { PagesService } from "./pages.service";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly pagesService: PagesService,
    private readonly dbClient: DBClient,
    private readonly eventDispatcher: DomainEventDispatcher,
    _outboxService: OutboxService,
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
    return Result.gen(async function* (this: CommentsService) {
      const comment = yield* Result.await(
        this.commentsRepository.createComment(this.dbClient, {
          pageId: input.pageId,
          authorId: userId,
          body: input.body,
          parentId: input.parentId ?? null,
        }),
      );

      const rootId = (comment.parentId ?? comment.id) as CommentId;
      const commentWithReplies = yield* Result.await(
        this.commentsRepository.getCommentById(rootId),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "comment.created",
          aggregateId: commentWithReplies.id,
          payload: {
            pageId: input.pageId,
            comment: commentWithReplies,
          },
        }),
      );

      return Result.ok(commentWithReplies);
    }, this);
  }

  async resolveComment(pageId: PageId, commentId: CommentId) {
    return Result.gen(async function* (this: CommentsService) {
      const resolved = yield* Result.await(
        this.commentsRepository.resolveComment(commentId),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "comment.resolved",
          aggregateId: commentId,
          payload: {
            pageId,
            commentId,
          },
        }),
      );

      return Result.ok(resolved);
    }, this);
  }

  async deleteComment(pageId: PageId, commentId: CommentId) {
    return Result.gen(async function* (this: CommentsService) {
      const deleted = yield* Result.await(
        this.commentsRepository.deleteComment(commentId),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "comment.deleted",
          aggregateId: commentId,
          payload: {
            pageId,
            commentId,
            parentId: deleted.parentId,
            isRoot: deleted.isRoot,
          },
        }),
      );

      return Result.ok(deleted);
    }, this);
  }

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
    if (!pageId) return Result.ok(null);

    return this.pagesService.loadPageResourceData({ pageId, userId }).then(
      Result.map((pageData) => {
        if (!pageData) return null;
        return {
          pageId,
          workspaceId: pageData.workspaceId,
          userWorkspaceRole: pageData.userWorkspaceRole,
          userPageRole: pageData.userPageRole,
        };
      }),
    );
  }
}
