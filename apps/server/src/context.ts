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
} from "@dotion/services";
import {
  DurableObjectWorkspaceEventPublisher,
  DurableObjectPageEventPublisher,
  DurableObjectUserEventPublisher,
  DurableObjectUserCreditsManager,
  CloudflarePageCleanupQueue,
} from "./lib/realtime-publishers";

export const createAppContext = (env: Env) => {
  const db = createDb(env.DATABASE_URL);

  const repositories = buildRepositories(db);
  const services = buildServices(repositories, db, env);

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

  return { auth, services };
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
  };
}

function buildServices(
  repositories: ReturnType<typeof buildRepositories>,
  db: DBClient,
  env: Env,
) {
  const kvCache = new KVAuthorizationCache(env.KV);
  const workspacePublisher = new DurableObjectWorkspaceEventPublisher(env);
  const pagePublisher = new DurableObjectPageEventPublisher(env);
  const userPublisher = new DurableObjectUserEventPublisher(env);
  const creditsManager = new DurableObjectUserCreditsManager(env);
  const pageCleanupQueue = new CloudflarePageCleanupQueue(env);

  const users = new UsersService(repositories.users);
  const notifications = new NotificationsService(
    repositories.notifications,
    db,
    userPublisher,
  );
  const workspaces = new WorkspacesService(
    repositories.workspaces,
    users,
    notifications,
    db,
    kvCache,
    workspacePublisher,
    userPublisher,
  );
  const pages = new PagesService(
    repositories.pages,
    workspaces,
    users,
    notifications,
    db,
    kvCache,
    workspacePublisher,
    pagePublisher,
    pageCleanupQueue,
  );
  const comments = new CommentsService(
    repositories.comments,
    pages,
    db,
    pagePublisher,
  );
  const storage = new StorageService(env.R2);

  // Search & Embedding Services
  const embedding = new EmbeddingService(env.GEMINI_API_KEY);
  const chunking = new ChunkingService();
  const search = new SearchService(repositories.search, embedding, pages, db);

  const ai = new AIService(env.GEMINI_API_KEY, creditsManager, search);

  const assistant = new AssistantService(
    repositories.assistant,
    search,
    ai,
    db,
  );

  const authorization = new AuthorizationService(
    { workspaces, pages, comments, users },
    kvCache,
  );

  return {
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
  };
}

export type AppContext = ReturnType<typeof createAppContext> & {
  currentUser: User;
};
