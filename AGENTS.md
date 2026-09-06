# Dotion — Agent Guide

This file is the single source of truth for any AI agent working in this monorepo.
Read it fully before writing any code.

---

## 1. Repository Map

```
dotion/
├── apps/
│   ├── server/          # Cloudflare Worker – Hono + OpenAPI backend
│   └── web/             # TanStack Start SPA – React frontend
├── packages/
│   ├── auth/            # Better-auth adapter (createAuth)
│   ├── db/              # Drizzle ORM schema + repositories
│   ├── services/        # Domain business logic (service layer)
│   └── shared/          # Zod schemas + branded types shared across apps
└── .agents/skills/      # Per-task skill instructions (durable-objects, wrangler, workers-best-practices)
```

The dependency graph flows strictly **one way**:

```
web / server  →  packages/services  →  packages/db  →  packages/shared
                                        ↑
                                   packages/auth
```

`packages/shared` is the only package that both `apps/` and `packages/` may import.
Never import `packages/db` or `packages/services` from `apps/web`.

---

## 2. Architecture Overview

### Backend (`apps/server`)

A **Cloudflare Worker** running [Hono](https://hono.dev/) with `@hono/zod-openapi`.
Stateful real-time collaboration and WebSocket fan-out are handled via **Cloudflare Durable Objects**.

#### Request lifecycle

```
HTTP request
  → CORS / CSRF / secureHeaders middlewares  (create-app.ts)
  → currentUserMiddleware                    (injects c.var.currentUser)
  → requirePermission (via createAuthorizedRoute) (evaluates pure policies via attribute loader & KV cache)
  → OpenAPI route (routes.ts)                (Zod-validated params/query/body)
  → handler (handlers.ts)                    (thin adapter: validates inputs, calls c.var.services.*, maps Result to HTTP response)
  → Service (packages/services)              (orchestrates business logic, DB transactions, inter-service calls, awaits event publishers)
  → Repository (packages/db/repositories)    (raw DB queries strictly isolated to its domain tables)
```

WebSocket upgrades are proxied directly to the respective Durable Object. Handlers contain **zero business logic, zero DB queries, and zero direct Durable Object stub calls**; all side-effects and real-time broadcasts are initiated and awaited within the service layer via port interfaces.

### Frontend (`apps/web`)

A **TanStack Start / React** SPA using TanStack Router (file-based routing).

#### Data flow

```
Route component  →  *Container component  →  useQuery / useSuspenseQuery / useMutation
                                              ↓
                                          Feature API class (api.ts)
                                              ↓
                                          Hono RPC client (getApiClient)
                                              ↓
                                          apps/server HTTP endpoints
```

Real-time updates arrive via `WebSocketClient` (see `src/lib/web-socket-client.ts`),
which implements **tab-leader election** via the Web Locks API so only one tab holds
the open socket; all other tabs receive messages through a `BroadcastChannel`.

---

## 3. Layer Contracts

### 3.1 `packages/shared` — canonical types & Zod schemas

- Every domain entity has a **Zod schema** and its TypeScript type is `z.infer<typeof Schema>`.
- IDs are **branded primitives** (`z.uuid().brand("PageId")`). Never use a plain `string` where a branded ID is expected.
- Schemas are generated from Drizzle table definitions via `createInsertSchema` / `createSelectSchema` from `drizzle-orm/zod`.
- Both server and client import types from here, not from each other.

### 3.2 `packages/db` — repositories

- Each domain has one `*Repository` class. Constructor receives `DBClient`.
- **Strict Repository Isolation (NO cross-domain SQL joins)**:
  - Repositories interact **exclusively** with tables belonging to their domain.
  - Never write queries joining or referencing tables from other domains (e.g. `workspaces.repo.ts` must never join `user` or `pagePermissions`).
  - If composite view-models are needed (e.g., workspace members with user details), repositories return primitive/filtered domain data, and the service layer coordinates cross-domain stitching.
- **Read methods** accept `DBClient` (`this.db`).
- **Write methods** that must be transactional accept `AppDB` (a transaction handle `tx`) as their **first argument** — the service layer is responsible for wrapping them in `this.dbClient.transaction(...)`.
- Return type is always `Promise<Result<T, DatabaseError | NotFoundError | UniqueConstraintViolationError>>`.
- Catch all Drizzle errors, log them with `console.error`, and return `Result.err(new DatabaseError(...))`. Never throw from a repository.

```ts
// ✅ correct repository pattern (single domain, no cross-table joins)
async createFoo(tx: AppDB, input: CreateFooInput): Promise<Result<Foo, DatabaseError>> {
  try {
    const [row] = await tx.insert(foos).values(input).returning();
    if (!row) return Result.err(new DatabaseError({ message: 'Failed to create foo' }));
    return Result.ok(row);
  } catch (error) {
    console.error('FooRepository.createFoo error:', error);
    return Result.err(new DatabaseError({ message: 'Failed to create foo' }));
  }
}
```

### 3.3 `packages/services` — service layer

- Each domain has one `*Service` class. Constructor receives:
  1. Its own domain `*Repository`
  2. Injected companion `*Service` instances for cross-domain requirements
  3. `DBClient`
  4. Real-time publisher / side-effect port interfaces (e.g. `WorkspaceEventPublisher`, `PermissionCacheInvalidator`, `PageCleanupQueue`)
- **Service isolation**: Each service only uses its own repository. If a service needs functionality or data from another domain, it must call the other domain's `*Service` — **never** import or call another domain's repository or database tables directly.
- **All business logic lives in services**: Validation, orchestration, authorization attribute loading, transactions, credit checks, notification creation, and event publishing belong in the service layer.
- **Result Composition with `Result.gen` & Combinators**:
  - **Never use repetitive `if (result.isErr()) return Result.err(result.error)` checks**.
  - Use `Result.gen(async function* (this: ServiceClass) { ... }, this)` with `yield* Result.await(...)` for multi-step synchronous or asynchronous workflows.
  - **Always pass `(this: ServiceClass)` and `this` as the second argument (`thisArg`)**: In TypeScript strict mode, `.bind(this)` loses generator return type inference. Always use the explicit `this` parameter annotation and pass `this` as the second argument: `Result.gen(async function* (this: WorkspacesService) { ... }, this)`.
  - Use fluent combinators (`Result.andThen`, `Result.andThenAsync`, `Result.map`, `Result.tryRecover`, `Result.tapAsync`) for short pipelines.
  - For optional/nullable resource fetching in attribute loaders, use `NotFoundError.is(res.error)` to return `Result.ok(null)` instead of letting not-found errors fail authorization.
- **Parallelizing Independent Asynchronous Operations**:
  - **Independent Reads**: Never execute independent asynchronous read queries sequentially. Compose them concurrently using `Result.allAsync([promise1, promise2])` (when returning `Result<T, E>`) or `await Promise.all([promise1, promise2])` (for resilient optional reads with fallbacks).
  - **Independent Side-Effects**: Always execute multiple independent post-mutation side-effects (WebSocket broadcasts, KV cache invalidations, Queue enqueues, notifications) concurrently via `await Promise.all([ ... ])` — and **always strictly await them**.
- **Subtree Deletions, Cascading Restores & Storage Asset Purging**:
  - When permanently deleting a hierarchical resource (such as a page with nested subpages):
    1. Retrieve the entire subtree of IDs via the repository (`allPageIds = [pageId, ...descendants]`).
    2. Execute a single batch delete in the database (`this.pagesRepository.deletePermanently(this.dbClient, allPageIds)`).
    3. Concurrently broadcast real-time events and enqueue Cloudflare Queue asset cleanup jobs for **every page in the deleted branch** (`workspaces/:workspaceId/pages/:pageId/`) via `Promise.all` so all attachments and uploaded assets in Cloudflare R2 are eradicated without leaving orphaned zombie files.
  - When restoring a parent page, cascade restore to all trashed descendant subpages while re-parenting to workspace root (`null`) if the original parent page is missing or in trash.
- **Transaction boundaries**:
  - Services own transaction boundaries. Wrap **multi-step atomic writes** in `this.dbClient.transaction(async (tx) => ...)`.
  - **Do NOT wrap single-step operations in a transaction**: Single queries/mutations (e.g. creating a thread, deleting a thread, updating a single role, or setting a permission) must pass `this.dbClient` directly to the repository method (`AppDB = DBClient | DBTransaction`).
  - Roll back on error using `Result.tapError(() => { tx.rollback() })`.

```ts
// ✅ correct service pattern (Result.gen, Result.await, Result.allAsync, inter-service call, Promise.all awaited side-effects)
async inviteMember(
  workspaceId: WorkspaceId,
  inviterId: UserId,
  input: InviteMemberInput,
): Promise<Result<WorkspaceInvitationWithDetails, DatabaseError | NotFoundError | UniqueConstraintViolationError>> {
  return Result.gen(async function* (this: WorkspacesService) {
    const targetUser = yield* Result.await(
      this.usersService.getUserByEmail(input.email),
    );

    const [inviterUser, workspace, isAlreadyMember] = yield* Result.await(
      Result.allAsync([
        this.usersService.getUserById(inviterId),
        this.workspacesRepository.getWorkspaceOnly(workspaceId),
        this.workspacesRepository.isMember(workspaceId, targetUser.id),
      ]),
    );

    if (isAlreadyMember) {
      yield* new DatabaseError({ message: "User is already a member of this workspace" });
    }

    const inviterName = inviterUser.name || "A member";

    const txResult = yield* Result.await(
      this.dbClient.transaction(async (tx) => {
        return Result.gen(async function* (this: WorkspacesService) {
          const invitation = yield* Result.await(
            this.workspacesRepository.createInvitation(tx, {
              workspaceId,
              invitedUserId: targetUser.id,
              invitedByUserId: inviterId,
              status: "pending",
            }),
          );

          const notification = yield* Result.await(
            this.notificationsService.createNotificationTx(tx, {
              userId: targetUser.id,
              metadata: {
                type: "workspace_invitation",
                workspaceInvitationId: invitation.id,
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                workspaceIcon: workspace.icon ?? undefined,
                invitedByUserId: inviterId,
                invitedByName: inviterName,
              },
              isRead: false,
            }),
          );

          return Result.ok({
            invitation: {
              ...invitation,
              workspaceName: workspace.name,
              workspaceIcon: workspace.icon ?? null,
              invitedByName: inviterName,
              invitedUserEmail: targetUser.email,
              invitedUserName: targetUser.name,
            },
            notification,
            targetUserId: targetUser.id,
          });
        }, this).then(
          Result.tapError(() => {
            tx.rollback();
          }),
        );
      }),
    );

    const { invitation, notification, targetUserId } = txResult;
    await Promise.all([
      this.userEventPublisher?.broadcastNotification(targetUserId, notification),
      this.workspaceEventPublisher?.broadcastInvitationCreated(workspaceId, invitation),
    ]);
    return Result.ok(invitation);
  }, this);
}
```

### 3.4 `apps/server` — route handlers

- Handlers are strictly **thin adapters**:
  1. Extract and validate parameters, query, and body via `c.req.valid(...)`.
  2. Invoke the appropriate service method via `c.var.services.<domain>.<method>(...)`.
  3. Pattern-match errors with `result.error.match({ ErrorTag: () => c.json(...) })`.
  4. Return `c.json(successResponseJson(result.value), HttpStatusCodes.*)`.
- **Zero Logic in Handlers**:
  - **No** database queries or transactions in handlers.
  - **No** direct Durable Object stub lookups or `c.env.DOTION_*` manipulation in handlers.
  - **No** credit checks or cache invalidation calls in handlers.
- Routes are defined using `createRoute` (aliased as `createOpenApiRoute`) or `createAuthorizedRoute` from `@hono/zod-openapi`.
- Export each route type: `export type FooRoute = typeof fooRoute`. Handlers are typed `AppRouteHandler<FooRoute>`.

```ts
// ✅ clean handler pattern (no DB, no DO, no logic)
export const createFooHandler: AppRouteHandler<CreateFooRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const input = c.req.valid("json");

  const result = await c.var.services.foos.createFoo(
    { userId: currentUser.id },
    input,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to create foo"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(errorResponseJson("Foo not found"), HttpStatusCodes.NOT_FOUND),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};
```

**Adding a new route to the server:**

1. Add route definition in `routes.ts` (export the type).
2. Add handler in `handlers.ts`.
3. Wire with `.openapi(route, handler)` in `index.ts`.
4. Register the sub-router in `app.ts` if it's a new domain.

### 3.5 `apps/web` — feature modules

Each feature lives in `src/features/<domain>/` and follows this fixed structure:

```
features/<domain>/
├── api.ts             # API class — calls Hono RPC or WebSocket/provider
├── query-options.ts   # TanStack Query keys + resultQueryOptions wrappers
├── types.ts           # Frontend-only types (inputs, view models)
├── errors.ts          # TaggedErrors specific to this domain
├── utils.ts           # Pure helpers (tree building, formatting, etc.)
├── hooks/             # useMutation, one file per operation (only for operations that mutate data)
│   └── use-<verb>-<noun>.ts
└── components/
    ├── <noun>-container.tsx    # Fetches data, owns loading/error states
    ├── <noun>-presenter.tsx    # Pure display; receives typed props
    ├── <noun>-loading.tsx      # Skeleton / spinner
    └── <noun>-error.tsx        # Error state UI
```

#### Data Fetching & Suspense Strategy

- **Main query of a page / route**: Always use `useSuspenseQuery` instead of `useQuery`.
- **Suspense boundaries**: Wrap components that use `useSuspenseQuery` in a `<Suspense>` component from React placed above them (at the route or parent component level).
- **Loading fallback**: The `<Suspense>` `fallback` prop must be a dedicated loading component (`<NounLoading />` from `*-loading.tsx`) built using `Skeleton` primitives from shadcn UI (`@/components/ui/skeleton`).
- **Secondary / Non-main queries**: Use `useQuery` for secondary, optional, or nested component data fetching.

#### Route Preloading (TanStack Router)

Preload queries used in that route within the route definition's `loader` (`createFileRoute`) using `queryClient` from the route context:

- **Queries using `useSuspenseQuery`**: MUST be awaited using `await queryClient.ensureQueryData(queryOptions)` so data is resolved before navigation completes.
- **Queries using `useQuery`**: Preload them **without awaiting** (e.g. `void queryClient.prefetchQuery(queryOptions)`) so fetching begins in the background without blocking route navigation.

```tsx
// ✅ route loader and Suspense pattern
export const Route = createFileRoute(
  "/app/workspaces/$workspaceId/pages/$pageId/",
)({
  loader: async ({ context: { queryClient }, params }) => {
    // 1. Await main suspense query
    await queryClient.ensureQueryData(pageDetailQueryOptions(params.pageId));

    // 2. Preload secondary query without awaiting
    void queryClient.prefetchQuery(pageCommentsQueryOptions(params.pageId));
  },
  component: PageRouteComponent,
});

function PageRouteComponent() {
  const { workspaceId, pageId } = Route.useParams();

  return (
    <Suspense fallback={<PageDetailLoading />}>
      <PageDetail workspaceId={workspaceId} pageId={pageId} />
    </Suspense>
  );
}
```

#### Container / Presenter split

The **Container / Presenter pattern** applies strictly to components that use `useQuery` (secondary, non-suspense queries):

- **Container** (`*-container.tsx`): calls `useQuery`, handles `isPending` / `isError` states, renders loading (`<NounLoading />` with shadcn `Skeleton`) / error (`<NounError />`) sub-components, and passes unwrapped data to the presenter.
- **Presenter** (`*-presenter.tsx`): receives plain typed props, calls domain hooks if it needs mutations or real-time state, renders UI. No `useQuery` or `useSuspenseQuery` calls.

**Components that use `useSuspenseQuery`**: There should NOT be 2 components (one container and one presenter). There should be only ONE component that fetches data using `useSuspenseQuery` and renders the UI directly, since loading states are handled externally by the parent `<Suspense>` boundary and errors bubble to error boundaries.

#### API class contract

- All methods return `Promise<Result<T, SomeTaggedError | ...>>`.
- Use `better-result`'s `TaggedError` for all feature-specific errors (defined in `errors.ts`).
- Call the Hono RPC client via `getApiClient()`. Map each HTTP status to a `Result.err(new SpecificError(...))` using `matchExhaustive(response.status, { ... })`.
- Singleton export at the bottom: `export const fooApi = new FooApi()`.

#### Query options

- Define a `fooKeys` factory object with typed key arrays.
- Wrap every `queryFn` with `resultQueryOptions(...)` — this unwraps `Result<T, E>` so `useQuery` sees a plain `T` on success and throws the error on failure (which TanStack Query surfaces as `query.error`).
- Wrap every `mutationFn` with `resultMutationOptions(...)`.

```ts
// ✅ query-options pattern
export const fooKeys = {
  all: ["foos"] as const,
  detail: (id: string) => [...fooKeys.all, "detail", id] as const,
};

export function fooDetailQueryOptions(id: string) {
  return resultQueryOptions({
    queryKey: fooKeys.detail(id),
    queryFn: () => fooApi.getFoo(id),
    staleTime: 10_000,
    enabled: Boolean(id),
  });
}
```

#### Mutation hooks

- One hook per mutation (one file per operation).
- When triggering mutations in components/handlers, **always use `mutateAsync`** (the async version of `mutate`) instead of `mutate` to allow awaiting completion and sequential coordination.

```ts
// ✅ hook pattern
export function useCreateFoo() {
  const queryClient = useQueryClient();
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: CreateFooInput) => fooApi.createFoo(input),
      onSuccess: (foo, vars) => {
        queryClient.invalidateQueries({ queryKey: fooKeys.all }); // use optimistic updates instead when possible
        // navigate or toast as appropriate
      },
      onError: (error) => {
        toast.error("Failed to create foo.");
      },
    }),
  );
}

// ✅ calling mutations pattern: use mutateAsync directly without try/catch unless necessary
async function handleCreate(input: CreateFooInput) {
  const created = await createFoo.mutateAsync(input);
  // post-mutation actions (e.g. close modal, navigate)
}
```

#### Hook Scoping & Anti-Prop-Drilling Rules

- **Call hooks as down the component tree as possible where needed**:
  - Mutation hooks (`useMutation`, custom hooks like `useCreate*`, `useDelete*`, `useUpdate*`), action handlers, and component-local mutation state MUST be called directly in the leaf/child component where the user action originates (e.g. inside `CommentComposer`, `CommentCard`, `PageTreeItem`, `InviteMemberForm`, `InvitationCard`, `DeletePermanentlyDialog`).
  - Container components (`*-container.tsx`) are strictly responsible for data query fetching (`useQuery`), loading states, and error handling. **Never instantiate mutation hooks in containers just to pass action callbacks (`onSubmit`, `onDelete`, `onResolve`, `onAccept`, etc.) or loading flags (`isSubmitting`, `isDeleting`) down as props**.
- **Avoid prop drilling**:
  - Do NOT drill action callbacks or mutation handlers through intermediate layers (e.g., `Container` → `Presenter` → `List` → `Item`).
  - Child and leaf components should receive domain entity identifiers (e.g. `{ workspaceId, pageId, commentId }`) and trigger mutations directly using their own hook instances.
  - Modals, Dialogs, and Drawers (`*Modal`, `*Dialog`, `*Drawer`) should own their own mutation calls and submission state internally rather than receiving `onSubmit`, `isSubmitting`, or `errorMessage` drilled from parent containers.

---

## 4. Error Handling

### `better-result` pattern

All async operations use `better-result`'s `Result<T, E>` monad. Never throw across layer boundaries.

| Layer                  | Error types to use                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `packages/db`          | `DatabaseError`, `NotFoundError`, `UniqueConstraintViolationError`, `ForeignKeyViolationError` (from `@dotion/db/errors`) |
| `packages/services`    | Forward repository errors unchanged                                                                                       |
| `apps/server` handlers | Map service errors to HTTP responses via `.error.match(...)`                                                              |
| `apps/web` API classes | Map HTTP status codes to feature-specific `TaggedError` instances                                                         |
| `apps/web` hooks       | Handle in `onError` callback; show `toast.error(...)` for user-visible failures                                           |

### TaggedError definition

```ts
// errors.ts in a feature or db package
import { TaggedError } from "better-result";

export class FooNotFoundError extends TaggedError("FooNotFoundError")<{
  message: string;
  fooId: string;
}> {}
```

### Exhaustive error matching in handlers

```ts
return result.error.match({
  DatabaseError: () => c.json(errorResponseJson("Internal error"), 500),
  NotFoundError: () => c.json(errorResponseJson("Foo not found"), 404),
});
```

---

## 5. Real-Time / WebSocket

There are **four** Durable Object classes, each with a distinct responsibility:

1. **`WorkspacesDO`** (`c.env.DOTION_WORKSPACE_DO`, keyed by `workspaceId`): Workspace-level events (page creation, member joins/removals, invitations, page permission updates).
2. **`PagesDO`** (`c.env.DOTION_PAGES_DO`, keyed by `pageId`): Per-page real-time Yjs CRDT synchronization, awareness (collaborator cursors/presence), and comment thread broadcasts.
3. **`UsersDO`** (`c.env.DOTION_USERS_DO`, keyed by `userId`): User-level events (real-time notification delivery, notification read states).
4. **`UserCreditsDO`** (`c.env.DOTION_USER_CREDITS_DO`, keyed by `userId`): Per-user AI generation token quota tracking, rate limiting, and credit settlement.

### 5.1 Port / Adapter Pattern for Real-Time & Side-Effects

Domain services in `packages/services` **must never import Cloudflare DO bindings or call DO stubs directly**. Real-time broadcasting and side-effects are decoupled using the Port / Adapter pattern:

- **Ports** (`packages/services/src/realtime.types.ts`): Abstract TypeScript interfaces:
  - `WorkspaceEventPublisher`: broadcast page created, member joined/removed, invitation lifecycle, page permissions.
  - `PageEventPublisher`: broadcast comment created, resolved, deleted.
  - `UserEventPublisher`: broadcast notifications, read receipts.
  - `UserCreditsManager`: check token quota, settle token usage.
  - `PermissionCacheInvalidator`: invalidate cached user/resource permissions in KV.
- **Adapters** (`apps/server/src/lib/realtime-publishers.ts`): Concrete Cloudflare implementations:
  - `DurableObjectWorkspaceEventPublisher`
  - `DurableObjectPageEventPublisher`
  - `DurableObjectUserEventPublisher`
  - `DurableObjectUserCreditsManager`
  - `KVAuthorizationCache` (implements `PermissionCacheInvalidator`)
- **Wiring** (`apps/server/src/context.ts`): Instantiated in `buildServices` and injected via constructor into the respective domain services.

> [!IMPORTANT]
> **Awaiting DO RPC Calls**: All Durable Object RPC methods return `Promise<void>` (or a result object) and **MUST be strictly `await`ed** in domain services. Never leave floating promises or fire-and-forget `void` calls, as Cloudflare Workers may freeze execution before unawaited promises resolve.
>
> **No DO Stubs in Route Handlers**: Route handlers must **never** call `c.env.DOTION_*` stubs or invoke DO RPC methods directly. Handlers delegate solely to domain services, and domain services trigger real-time broadcasts through their injected publisher ports.

### 5.2 `WorkspacesDO` — workspace-level events

- **Binding:** `c.env.DOTION_WORKSPACE_DO`, keyed by workspace ID.
- **WebSocket upgrade endpoint:** `GET /api/v1/workspaces/:id/ws` (wired in `routes/workspaces/index.ts`). The Worker proxies the request, injecting `X-User-Id` in the headers.
- **Purpose:** Fan-out of workspace-scoped server-initiated events (e.g. `page.created`, `workspace.member_joined`) to all connected clients.
- Events are triggered by `WorkspacesService` or `PagesService` calling methods on `this.workspaceEventPublisher`.
- Incoming client messages are validated with the shared `WorkspaceWsMessageSchema` before being broadcast to all other sockets.

### 5.3 `PagesDO` — per-page Yjs collaboration + comment events

- **Binding:** `c.env.DOTION_PAGES_DO`, keyed by page ID: `c.env.DOTION_PAGES_DO.idFromName(pageId)`.
- **WebSocket upgrade endpoint:** `GET /api/v1/workspaces/:id/pages/:pageId/ws` (wired in `routes/workspaces/pages/index.ts`). The Worker injects `X-User-Id`, `X-User-Name`, and `X-User-Color` headers.
- **Purpose:** Runs the Yjs sync + awareness protocol for real-time collaborative editing, and broadcasts comment events to page collaborators.

#### Internal structure of `PagesDO`

| Class             | File                  | Role                                                                                    |
| ----------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `PagesDO`         | `durable-object.ts`   | DO entry point — accepts WS, delegates to helpers                                       |
| `PageDocument`    | `page-document.ts`    | In-memory Yjs `Y.Doc` + `Awareness` wrapper with dirty-tracking                         |
| `PagePersistence` | `page-persistence.ts` | Reads/writes Yjs state to DO storage (cache) and calls `PagesService` (source of truth) |
| `YjsProtocol`     | `yjs-protocol.ts`     | Stateless encode/decode of the `y-protocols` sync and awareness wire format             |

#### Connection lifecycle

1. On the first `fetch()`, `PagesDO.initialize(pageId)` is called (idempotent — guarded by `this.initialization` to avoid concurrent double-init).
2. `PagePersistence.loadInitialState()` tries DO KV storage first, then falls back to the database via `PagesService.getPageContent`. The state is cached in DO storage on first load.
3. The Yjs doc is hydrated via `PageDocument.load()`. The `onUpdate` callback is wired to `PagePersistence.schedulePersist()`.
4. On WebSocket open, the DO immediately sends `YjsProtocol.encodeSyncStep1()` to the new client, plus the current awareness snapshot for all existing clients.

#### Message handling

All WebSocket messages from clients are binary (`ArrayBuffer`). String messages are ignored. `YjsProtocol.handleMessage()` classifies them:

| Message type                                | Action                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `MSG_SYNC` / `SYNC_STEP_1` or `SYNC_STEP_2` | Reply privately to sender only (handshake)                                                                         |
| `MSG_SYNC` / `SYNC_UPDATE`                  | `readSyncMessage` applies the update to the shared `Y.Doc`; original bytes broadcast to all other clients          |
| `MSG_AWARENESS`                             | Apply to shared `Awareness`; reconstruct and broadcast to all other clients; track client IDs in the WS attachment |

#### Persistence strategy

- **Tier 1 (DO Local Storage)**: Every Yjs update immediately snapshots and saves the binary CRDT state to DO storage (`storage.put('yjs-state', ...)`), ensuring zero data loss if the DO memory process is evicted or restarted.
- **Tier 2 (PostgreSQL Checkpointing)**: Content changes are flushed to PostgreSQL periodically (30s active editing checkpoint, or 10s idle debounce) to minimize database write load while ensuring search indexes and backups remain fresh.
- **Page Metadata (Title, Icon, Cover)**: Preserves a fast 2-second debounce for PostgreSQL writes, ensuring the workspace page tree, breadcrumbs, and search results reflect renames and icon changes quickly.
- **Disconnect Flush**: When the **last WebSocket disconnects** (`getWebSockets().length === 0`), `persistImmediately()` cancels pending alarms and immediately flushes all pending content and metadata to PostgreSQL.

#### Comment event broadcasting (via Service)

After comment mutations (create/resolve/delete), `CommentsService` calls its injected `pageEventPublisher` directly:

```ts
// ✅ comment broadcast pattern (inside CommentsService)
await this.pageEventPublisher.broadcastCommentCreated(pageId, comment);
```

`DurableObjectPageEventPublisher` calls `stub.broadcastCommentEvent(event)`, which serializes the event to JSON and sends it to **all** connected sockets (including the sender, allowing the sender to use `requestId` to deduplicate its optimistic update).

#### `WsAttachment`

Each WebSocket connection carries a serialized `WsAttachment` with `{ userId, userName, userColor, awarenessClientIds[] }`. The `awarenessClientIds` array is updated as awareness messages arrive so that on disconnect the DO can cleanly remove only the states belonging to that connection and broadcast the removal to remaining peers.

### 5.4 `UsersDO` & `UserCreditsDO`

- **`UsersDO`** (`c.env.DOTION_USERS_DO`): Provides user-level WebSocket channels for delivering notifications and read receipts in real time.
- **`UserCreditsDO`** (`c.env.DOTION_USER_CREDITS_DO`): Provides serialized, race-condition-free token quota checking (`checkTokenQuota`) and token usage settlement (`settleTokenUsage`) for AI features.

### 5.5 Client side

- `WebSocketClient<TMessage>` in `src/lib/web-socket-client.ts` handles connection lifecycle, tab-leader election (via `navigator.locks`), cross-tab message relay (via `BroadcastChannel`), and exponential-backoff reconnect.
- Instantiate one client per workspace / page, connect it once, subscribe to messages in hooks, and destroy it on unmount.
- Do not create raw `WebSocket` instances in feature code — always go through `WebSocketClient`.

---

## 6. Authorization (ABAC)

Dotion implements a **pure Attribute-Based Access Control (ABAC)** system. Authorization decisions are decoupled into pure synchronous policy evaluation, centralized attribute loading, persistent KV caching, and declarative type-safe route enforcement.

### 6.1 Architecture & Separation of Concerns

```
HTTP Request
  → createAuthorizedRoute
      → currentUserMiddleware (authenticates & injects user)
      → requirePermission (authorization middleware)
          → AuthorizationService.authorize({ user, resource, action, context })
              1. Check KV Authorization Cache (cache hit → return Decision)
              2. AttributeLoader.loadResourceData / loadScopeData (delegates to domain services via Promise.all)
              3. PolicyEngine.evaluate({ user, resource | scope, action, context }) (Pure Policy)
              4. Cache ALLOW decisions in KV (TTL: 60s)
          → IF DENY → 403 Forbidden
          → IF ALLOW → handler
```

- **Pure Policies** (`packages/services/src/authorization/policies/`): Pure, synchronous functions. They receive `{ user, resource: ResourceData<R>, context }` (for instance actions) or `{ user, scope: ScopeData<R>, context }` (for collection actions) and return `allow(...)` or `deny(...)`. Policies do **not** perform I/O, database queries, or have loaders injected.
- **AttributeLoader** (`packages/services/src/authorization/loader.ts`): Centralizes all attribute resolution by delegating to dedicated domain service methods (e.g. `workspacesService.loadWorkspaceResourceData`, `pagesService.loadPageResourceData`). **Has zero repository dependencies and executes no raw database queries.** Uses `Promise.all` for independent concurrent queries.
- **PolicyEngine** (`packages/services/src/authorization/engine.ts`): Synchronous registry and evaluator of domain resource policies.
- **KVAuthorizationCache** (`packages/services/src/authorization/cache.ts`): Backed by Cloudflare KV (`DOTION_CACHE_KV` / in-memory fallback). Implements `PermissionCacheInvalidator`. Note: In Cloudflare Workers, in-memory caches do not persist across worker invocations; KV is the persistent cache.
- **AuthorizationService** (`packages/services/src/authorization/authorization.service.ts`): Orchestrates cache lookups, attribute loading, policy evaluation, and cache updates.

### 6.2 Resource Layer Contract (`packages/shared/src/authorization`)

Every resource registered in the authorization system is defined in `resourceSchemas` in `packages/shared/src/authorization/schema.ts`:

- **`ResourceInput<R>`**: Non-optional required identifiers for instance-level actions (e.g. `{ pageId: PageId }`, `{ workspaceId: WorkspaceId, memberUserId: UserId }`).
- **`ResourceData<R>`**: Lean, minimal entity attributes required for policy evaluation (e.g. `{ pageId, workspaceId, userWorkspaceRole, userPageRole }`). Never pass full DB rows or unused metadata (such as `title`, `content`, `icon`, `createdAt`).
- **`ScopeData<R>`**: Contextual attributes of the parent container for collection actions (e.g. `{ workspaceId, userWorkspaceRole }` when creating a page).

### 6.3 Instance Actions vs. Collection Actions

| Action Type            | Examples                                                               | Input Mapping                                                    | Policy Parameter            | Purpose                                                                |
| :--------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------- | :-------------------------- | :--------------------------------------------------------------------- |
| **Instance Actions**   | `page.view`, `page.update`, `comment.delete`, `workspaceMember.remove` | `mapInput: ({ params, query, body, c }) => ResourceInput<R>`     | `resource: ResourceData<R>` | Verifies access to a specific, existing entity instance.               |
| **Collection Actions** | `page.create`, `page.list`, `workspaceMember.list`, `comment.create`   | `mapScope?: ({ params, query, c }) => Partial<ResourceInput<R>>` | `scope: ScopeData<R>`       | Verifies permissions in the parent container (e.g. workspace or page). |

### 6.4 Route Definition via `createAuthorizedRoute`

All protected backend endpoints must be declared using `createAuthorizedRoute` (from `#/lib/create-authorized-route`):

```ts
// ✅ createAuthorizedRoute pattern (Instance Action)
export const getPageByIdRoute = createAuthorizedRoute({
  tags: ["Pages"],
  summary: "Get page details",
  method: "get",
  path: "/{pageId}",
  authorization: {
    resource: "page",
    action: "view",
    mapInput: ({ params }) => ({ pageId: params.pageId, workspaceId: params.id }),
  },
  request: {
    params: z.object({ id: workspaceId, pageId: pageId }),
  },
  responses: { ... },
});

// ✅ createAuthorizedRoute pattern (Collection Action)
export const createPageRoute = createAuthorizedRoute({
  tags: ["Pages"],
  summary: "Create a page in workspace",
  method: "post",
  path: "/pages",
  authorization: {
    resource: "page",
    action: "create",
    mapScope: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({ id: workspaceId }),
    body: jsonContentRequired(CreatePageSchema, "Page payload"),
  },
  responses: { ... },
});
```

- `createAuthorizedRoute` automatically injects `currentUserMiddleware` and `requirePermission(...)`.
- `mapInput` and `mapScope` contextually receive strictly-typed `params`, `query`, and `body` directly from `request`.
- Route handlers continue to access validated inputs via `c.req.valid('param')`, `c.req.valid('query')`, and `c.req.valid('json')`.

### 6.5 Real-Time Permission Invalidation

When permission-altering mutations occur (e.g. `updateMemberRole`, `updatePagePermission`, `removeMember`):

1. The service modifies the database inside a transaction.
2. The service invalidates the affected user's KV authorization cache keys via its injected `PermissionCacheInvalidator` port: `await this.permissionCacheInvalidator.invalidateUserPermissions(userId, ...)`.
3. The service broadcasts permission invalidation events over WebSockets via its injected `WorkspaceEventPublisher` or `PageEventPublisher`.
4. Route handlers do **not** manage cache invalidations or DO stubs directly.

---

## 7. Cloudflare / Wrangler Specifics

- Before running any `wrangler` command, read `.agents/skills/wrangler/SKILL.md`.
- Before adding a new Durable Object or modifying DO code, read `.agents/skills/durable-objects/SKILL.md`.
- Before writing new Worker code or modifying `apps/server`, read `.agents/skills/workers-best-practices/SKILL.md`.
- Never use `async_hooks`, floating promises, or Node.js-only APIs in Worker code.
- Environment variables and secrets are accessed via `c.env.*` in handlers (typed through the global `Env` interface).

### 7.1 Durable Objects vs. Cloudflare Queues

Use the right Cloudflare primitive for the job:

| Primitive                                | Mechanism & Strengths                                                                                                                  | Ideal Use Cases in Dotion                                                                                                                                                                                                                                                                                                            | Anti-patterns (Do NOT use for)                                                                                                                                    |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Durable Objects** (`DOTION_*_DO`)      | Strongly-consistent single-point-of-coordination, in-memory state, active WebSocket connections, sub-millisecond coordination, alarms. | • Real-time Yjs CRDT doc sync (`PagesDO`)<br>• Presence / awareness broadcasting<br>• Workspace/page event fan-out (`WorkspacesDO`)<br>• User notifications & read states (`UsersDO`)<br>• Real-time token quota checking & rate limiting (`UserCreditsDO`)                                                                          | Asynchronous background processing that doesn't need in-memory coordination; fire-and-forget tasks with high latency or external API calls (e.g. email delivery). |
| **Cloudflare Queues** (`DOTION_*_QUEUE`) | Guaranteed at-least-once asynchronous message delivery, automatic retries with backoff, batch consumption, dead-letter queues.         | • Transactional email dispatch (invitations, password resets)<br>• R2 storage cleanup / trash purging (unlinking orphaned attachments when pages are permanently deleted)<br>• AI vector embeddings & indexing (updating vector indexes asynchronously without blocking page saves)<br>• Heavy batch database writes / audit logging | Interactive, low-latency client synchronization; real-time cursor/presence updates; requests that require an immediate synchronous response.                      |

#### Queue Architecture & Port Pattern

Just like Durable Objects, Queue producers should be abstracted behind port interfaces in `packages/services`:

1. **Service Port**: Define an interface in `packages/services/src/` (e.g. `EmailJobQueue`, `AssetCleanupQueue`).
2. **Server Adapter**: Implement the adapter in `apps/server/src/lib/` using `c.env.QUEUE_NAME.send(...)` and inject it into the service in `context.ts`.
3. **Queue Consumer**: Implement the Worker's `queue(batch, env, ctx)` export in `apps/server/src/index.ts` to process batched messages with automatic retries and error reporting.

---

## 8. Code Quality Preferences

### TypeScript

- **Strict mode** everywhere. Never use `any` unless bridging an untyped third-party boundary, and comment why.
- Use **branded types** for all IDs — `UserId`, `PageId`, `WorkspaceId`, etc. Never accept a plain `string` where a branded ID is needed.
- Prefer `interface` over `type` for object shapes; use `type` for unions and aliases.
- Use `satisfies` when asserting a literal matches a type without widening it.
- Export types with `export type { ... }` — avoids unintentional value imports.

### Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`.
- React components and classes: `PascalCase`.
- Functions, variables, hooks: `camelCase`.
- Hook files: `use-<verb>-<noun>.ts` (e.g. `use-create-page.ts`).
- Component files: `<noun>-<role>.tsx` (e.g. `page-detail-container.tsx`).
- Zod schemas: `PascalCase` with `Schema` suffix (`CreatePageSchema`).
- Zod-inferred types: same name without suffix (`CreatePage`, `Page`).

### Imports

- Use the `@/` alias for `apps/web/src/*` imports in the web app.
- Use the `#/` alias for `apps/server/src/*` imports in the server app.
- Use full package names (`@dotion/shared/pages/types`) for cross-package imports.
- Group imports: external packages first, then internal `@/` / `#/` paths, then relative paths.
- **No barrel files (`index.ts`) in frontend features**: Import directly from the specific component, hook, or query-options file (e.g. `@/features/pages/components/page-detail`, `@/features/pages/query-options`). Barrel files (`index.ts`) inside `src/features/*` are not allowed.

### React

- Follow the **Container / Presenter pattern** described in §3.5 strictly for components using `useQuery` — never mix data fetching and rendering in the same component. For components using `useSuspenseQuery`, do **not** use separate container and presenter components — there must be only ONE single component that fetches data with `useSuspenseQuery` and renders the UI directly.
- **Main query of a page / route**: Always use `useSuspenseQuery` for the primary page data, wrap the component in React `<Suspense>`, and provide a `fallback` with a loading component built with shadcn `Skeleton` (`@/components/ui/skeleton`).
- **Route Preloading**: In `createFileRoute` loaders, use `await queryClient.ensureQueryData(...)` for suspense queries, and prefetch without awaiting (`void queryClient.prefetchQuery(...)`) for `useQuery`.
- **Mutations (`useMutation`)**: Always use the async version `mutateAsync` (e.g. `await mutation.mutateAsync(...)`) instead of `mutate` when executing mutations in functions, event handlers, or components.
- One hook per mutation (one file per hook). Keep hooks small: wrap `useMutation`, handle `onSuccess` / `onError`, return the mutation object.
- Avoid prop drilling beyond two levels — lift state to the container or use a context.

### Service / Repository

- **Service isolation**: Each service only accesses its own repository. If a service needs data or operations from another domain, it must call that domain's `*Service`, never another repository directly.
- **Zero cross-domain SQL joins**: Repositories must strictly query only their own domain tables. Never perform SQL joins across bounded contexts (e.g. no joins between workspaces, pages, users, comments, or permissions). Cross-domain composition happens exclusively in the service layer.
- **Concurrent async operations (`Result.allAsync` vs `Promise.all`)**:
  - If multiple asynchronous operations do not depend on each other, use `Result.allAsync([...])` when operating on `Result`-returning functions.
  - Use `Promise.all([...])` only when operating on non-`Result` promises (e.g. independent DB queries inside an adapter).
  - Never run independent operations sequentially with `await` when they can run concurrently.
- **Awaiting DO RPC calls**: All Durable Object RPC methods return `Promise<void>` (or a result) and **MUST be strictly `await`ed** within services. Never leave floating promises or unawaited calls.
- Keep service methods short. Complex orchestration belongs in the service, not the handler or repository.
- Repository methods should do exactly one SQL operation or a closely related pair. No business logic.
- All transactional methods take `tx: AppDB` as the first parameter.

### General

- Preserve all existing comments and docstrings unrelated to your change.
- Do not add `console.log` for debugging; only `console.error` for caught errors at repository and handler boundaries.
- Do not introduce new dependencies without confirming with the user.
- Run `bun run typecheck` (or `bun run build`) after any structural change to verify no regressions.

---

## 9. Checklist: Adding a New Feature

Use this checklist when a full new domain (e.g. "notifications") is requested.

### Backend

- [ ] Define Drizzle table(s) in `packages/db/src/schema/<domain>.ts` and export from `schema/index.ts`.
- [ ] Define Drizzle relations in `packages/db/src/schema/relations.ts` (bounded strictly to domain tables).
- [ ] Define Zod schemas and branded types in `packages/shared/src/<domain>/schema.ts` and `types.ts`.
- [ ] Register resource, actions, `ResourceInput`, `ResourceData`, `ScopeData` in `packages/shared/src/authorization/schema.ts`.
- [ ] Create `packages/db/src/repositories/<domain>.repo.ts` (class, Result-returning methods, strict domain table isolation with ZERO cross-domain joins).
- [ ] Export repository from `packages/db/src/repositories/index.ts`.
- [ ] Create `packages/services/src/<domain>.service.ts` (class, transaction-aware methods, uses `Result.allAsync` for concurrent Result operations, injects own repository + other domain services for cross-domain needs, injects publishers/invalidators from `realtime.types.ts`).
- [ ] Expose dedicated attribute-loading methods on the service (`load<Domain>ResourceData`, `load<Domain>ScopeData`) for authorization.
- [ ] Export service from `packages/services/src/index.ts`.
- [ ] Define pure domain policy in `packages/services/src/authorization/policies/<domain>.policy.ts` and register in `packages/services/src/authorization/authorization.service.ts`.
- [ ] Add attribute loading branches in `packages/services/src/authorization/loader.ts` calling the domain service methods.
- [ ] Define any publisher/queue port interfaces in `packages/services/src/realtime.types.ts` and implement adapters in `apps/server/src/lib/realtime-publishers.ts`.
- [ ] Instantiate repository, adapters, and service in `apps/server/src/context.ts` (`buildRepositories`, `buildServices`).
- [ ] Create `apps/server/src/routes/<domain>/routes.ts` with `createAuthorizedRoute` (or `createOpenApiRoute` if purely public/personal).
- [ ] Create `apps/server/src/routes/<domain>/handlers.ts` (pure HTTP translation adapters: extract/validate inputs, call service, map Result to HTTP responses; NO direct DB queries, NO DO stub calls, NO cache invalidations in handlers).
- [ ] Create `apps/server/src/routes/<domain>/index.ts` and wire routes + handlers.
- [ ] Mount sub-router in `apps/server/src/app.ts`.

### Frontend

- [ ] Create `apps/web/src/features/<domain>/errors.ts` (domain `TaggedError` subclasses).
- [ ] Create `apps/web/src/features/<domain>/types.ts` (frontend input/view-model types).
- [ ] Create `apps/web/src/features/<domain>/api.ts` (`*Api` class + singleton export).
- [ ] Create `apps/web/src/features/<domain>/query-options.ts` (`*Keys` + `resultQueryOptions` wrappers).
- [ ] Create hooks in `apps/web/src/features/<domain>/hooks/use-*.ts`.
- [ ] Create components (single component for suspense queries, or Container + Presenter for `useQuery`, + Loading with shadcn Skeleton + Error).
- [ ] Direct path imports everywhere (no barrel `index.ts` files in features).
- [ ] Add route file in `apps/web/src/routes/` with route preloading in `loader` (`await queryClient.ensureQueryData(...)` for main query, non-blocking `void queryClient.prefetchQuery(...)` for secondary queries) and wrap suspense components in `<Suspense fallback={<*Loading />}>`.
- [ ] Subscribe to WebSocket events in the relevant hook/component if real-time updates are needed.

---

## 10. Internationalization (i18n)

We support multilingual capabilities (English, French, Arabic) on the frontend via Paraglide.

### 10.1 Rules & Guidelines

1. **Translation Catalogs**:
   - User-facing text must be stored in `apps/web/messages/{locale}.json` (e.g. `en.json`, `fr.json`, `ar.json`).
   - Every locale catalog MUST share identical JSON keys. Keep them ordered and clean.
2. **Auto-generated runtime files**:
   - Do NOT manually modify any file inside `apps/web/src/paraglide/*`. They are compiled and updated automatically from the message JSON catalogs by the Paraglide compiler.
3. **Usage in Components**:
   - Import translations using `import { m } from '@/paraglide/messages'`.
   - Render translation strings by calling the message functions (e.g., `{m.page_untitled()}`).
   - Pass any dynamic interpolation variables as parameters (e.g., `{m.toast_workspace_invited({ email })}`).
4. **Right-to-Left (RTL) Layouts**:
   - Ensure components adapt to RTL layouts when Arabic is selected.
   - The layout direction is derived dynamically at the root node using `getTextDirection(locale)`. Check and support proper logical CSS properties (e.g. `start` and `end` instead of `left` and `right`) where needed.
