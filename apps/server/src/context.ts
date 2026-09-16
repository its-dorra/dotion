import { createAuth, type User } from "@dotion/auth";
import { createDb, type DBClient } from "@dotion/db";
import {
  WorkspacesRepository,
  PagesRepository,
  CommentsRepository,
  UsersRepository,
  NotificationsRepository,
  SearchRepository,
  AssistantRepository,
  OutboxRepository,
} from "@dotion/db/repositories";
import {
  WorkspacesService,
  PagesService,
  CommentsService,
  UsersService,
  NotificationsService,
  AuthorizationService,
  KVAuthorizationCache,
  StorageService,
  AIService,
  EmbeddingService,
  ChunkingService,
  SearchService,
  AssistantService,
  OutboxService,
} from "@dotion/services";
import {
  DurableObjectWorkspaceEventPublisher,
  DurableObjectPageEventPublisher,
  DurableObjectUserEventPublisher,
  DurableObjectUserCreditsManager,
  CloudflarePageCleanupQueue,
} from "./lib/realtime-publishers";
import {
  DomainEventRouter,
  PageCreatedStrategy,
  PageMovedToTrashStrategy,
  PageRestoredStrategy,
  PageDeletedPermanentlyStrategy,
  TrashEmptiedStrategy,
  PageContentUpdatedStrategy,
  PageIndexingLegacyStrategy,
  PageMetadataUpdatedStrategy,
  PageAccessRequestedStrategy,
  PageAccessRequestResolvedStrategy,
  PagePermissionUpdatedStrategy,
  WorkspaceInvitationCreatedStrategy,
  WorkspaceMemberJoinedStrategy,
  WorkspaceMemberRemovedStrategy,
  WorkspaceInvitationCancelledStrategy,
  WorkspaceInvitationDeclinedStrategy,
  CommentCreatedStrategy,
  CommentResolvedStrategy,
  CommentDeletedStrategy,
  type ExecutionContextLike,
} from "./events";

export const createAppContext = (
  env: Env,
  executionCtx?: ExecutionContextLike,
) => {
  const db = createDb(env.DATABASE_URL);
  const ctx: ExecutionContextLike = executionCtx ?? {
    waitUntil: (promise: Promise<unknown>) => void promise,
  };

  const repositories = buildRepositories(db);
  const { services, eventRouter } = buildServices(repositories, db, env, ctx);

  const auth = createAuth(
    db,
    {
      set(key, value, ttl) {
        if (ttl) {
          return env.KV.put(key, value, { expirationTtl: Math.max(ttl, 60) });
        }
        return env.KV.put(key, value);
      },
      get(key) {
        return env.KV.get(key);
      },
      delete(key) {
        return env.KV.delete(key);
      },
      async getAndDelete(key) {
        const val = await env.KV.get(key);
        if (val !== null) {
          await env.KV.delete(key);
        }
        return val;
      },
      async increment(key, ttl = 60) {
        const current = await env.KV.get(key);
        const next = (current ? parseInt(current, 10) || 0 : 0) + 1;
        await env.KV.put(key, String(next), {
          expirationTtl: Math.max(ttl, 60),
        });
        return next;
      },
    },
    {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      CORS_ORIGIN: env.CORS_ORIGIN,
      GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
      NODE_ENV: env.NODE_ENV,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    },
  );

  return { auth, services, eventRouter };
};

function buildRepositories(db: DBClient) {
  return {
    users: new UsersRepository(db),
    workspaces: new WorkspacesRepository(db),
    notifications: new NotificationsRepository(db),
    pages: new PagesRepository(db),
    comments: new CommentsRepository(db),
    search: new SearchRepository(db),
    assistant: new AssistantRepository(db),
    outbox: new OutboxRepository(db),
  };
}

function buildServices(
  repositories: ReturnType<typeof buildRepositories>,
  db: DBClient,
  env: Env,
  executionCtx: ExecutionContextLike,
) {
  const kvCache = new KVAuthorizationCache(env.KV);
  const workspacePublisher = new DurableObjectWorkspaceEventPublisher(env);
  const pagePublisher = new DurableObjectPageEventPublisher(env);
  const userPublisher = new DurableObjectUserEventPublisher(env);
  const creditsManager = new DurableObjectUserCreditsManager(env);
  const pageCleanupQueue = new CloudflarePageCleanupQueue(env);

  const outbox = new OutboxService(repositories.outbox, db);
  const users = new UsersService(repositories.users);
  const notifications = new NotificationsService(
    repositories.notifications,
    userPublisher,
  );

  const eventRouter = new DomainEventRouter(executionCtx)
    .register(new PageCreatedStrategy(workspacePublisher))
    .register(new PageMovedToTrashStrategy(workspacePublisher))
    .register(new PageRestoredStrategy(workspacePublisher))
    .register(
      new PageDeletedPermanentlyStrategy(workspacePublisher, pageCleanupQueue),
    )
    .register(new TrashEmptiedStrategy(workspacePublisher, pageCleanupQueue))
    .register(new PageContentUpdatedStrategy(env.PAGE_INDEXING_QUEUE))
    .register(new PageIndexingLegacyStrategy(env.PAGE_INDEXING_QUEUE))
    .register(new PageMetadataUpdatedStrategy(env.PAGE_INDEXING_QUEUE))
    .register(new PageAccessRequestedStrategy(notifications))
    .register(new PageAccessRequestResolvedStrategy(notifications))
    .register(
      new PagePermissionUpdatedStrategy(
        kvCache,
        workspacePublisher,
        notifications,
      ),
    )
    .register(
      new WorkspaceInvitationCreatedStrategy(workspacePublisher, notifications),
    )
    .register(new WorkspaceMemberJoinedStrategy(workspacePublisher, kvCache))
    .register(new WorkspaceMemberRemovedStrategy(workspacePublisher, kvCache))
    .register(new WorkspaceInvitationCancelledStrategy(workspacePublisher))
    .register(new WorkspaceInvitationDeclinedStrategy(workspacePublisher))
    .register(new CommentCreatedStrategy(pagePublisher))
    .register(new CommentResolvedStrategy(pagePublisher))
    .register(new CommentDeletedStrategy(pagePublisher));

  const workspaces = new WorkspacesService(
    repositories.workspaces,
    users,
    db,
    eventRouter,
    outbox,
  );
  const pages = new PagesService(
    repositories.pages,
    workspaces,
    users,
    db,
    eventRouter,
    outbox,
  );
  const comments = new CommentsService(
    repositories.comments,
    pages,
    db,
    eventRouter,
    outbox,
  );
  const storage = new StorageService(env.R2);

  const embedding = new EmbeddingService();
  const chunking = new ChunkingService();
  const search = new SearchService(
    repositories.search,
    embedding,
    chunking,
    pages,
    db,
  );

  const ai = new AIService(creditsManager, search, pages, chunking);

  const assistant = new AssistantService(repositories.assistant, ai, db);

  const authorization = new AuthorizationService(
    { workspaces, pages, comments, users },
    kvCache,
  );

  return {
    services: {
      users,
      notifications,
      workspaces,
      pages,
      comments,
      authorization,
      storage,
      ai,
      embedding,
      chunking,
      search,
      assistant,
      outbox,
    },
    eventRouter,
  };
}

export type AppContext = ReturnType<typeof createAppContext> & {
  currentUser: User;
};
