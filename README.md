<p align="center">
  <img src="apps/web/public/pwa-512x512.png" alt="Dotion Logo" width="120" />
</p>

<h1 align="center">Dotion</h1>

<p align="center">
  <strong>A modern, real-time collaborative workspace — inspired by Notion, engineered for the edge.</strong>
</p>

<p align="center">
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#design-patterns--code-style">Design Patterns</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

Dotion is a full-featured, open-source Notion alternative built as a **modular monolith** and deployed entirely on **Cloudflare's edge platform**. The backend is structured around bounded domain modules with strict isolation, communicating through a **transactional outbox** and **domain event system** for reliable, **event-driven** side-effects. Background work — from semantic page indexing to storage asset cleanup — is offloaded to **Cloudflare Queues**. An **agentic RAG assistant** with full workspace access uses tool-calling to search, retrieve, and reason over all documents in real time. The frontend is a React 19 SPA with Yjs-powered CRDT collaboration, deployed as a Cloudflare Worker with a zero-latency service binding to the backend.

---

## Tech Stack

### Backend

| Technology                                                                                                           | Purpose                                                          |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [Cloudflare Workers](https://workers.cloudflare.com/)                                                                | Edge runtime (V8 isolates, globally distributed)                 |
| [Hono](https://hono.dev/) + [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) | Web framework with auto-generated OpenAPI specs                  |
| [Drizzle ORM](https://orm.drizzle.team/)                                                                             | Type-safe SQL query builder & migrations                         |
| [Neon](https://neon.tech/)                                                                                           | Serverless PostgreSQL (pgvector HNSW + Lakebase BM25)            |
| [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)                                     | Stateful real-time coordination (SQLite + WebSocket Hibernation) |
| [Cloudflare R2](https://developers.cloudflare.com/r2/)                                                               | Object storage for file uploads                                  |
| [Cloudflare KV](https://developers.cloudflare.com/kv/)                                                               | Session cache & authorization decision cache                     |
| [Cloudflare Queues](https://developers.cloudflare.com/queues/)                                                       | Background job processing (indexing, cleanup)                    |
| [Better Auth](https://www.better-auth.com/)                                                                          | Authentication (email/password, Google, GitHub OAuth)            |
| [Yjs](https://yjs.dev/)                                                                                              | CRDT real-time document synchronization                          |
| [Vercel AI SDK 7](https://ai-sdk.dev/)                                                                               | AI streaming, agentic tool calling, RAG orchestration            |
| [ai-fallback](https://github.com/lucas-reynoso/ai-fallback)                                                          | Resilient multi-provider failover (Google Gemini ⇄ Groq OSS)     |
| [Zod 4](https://zod.dev/)                                                                                            | Runtime schema validation & branded types                        |
| [better-result](https://github.com/ArcticZeroo/better-result)                                                        | Result monad & TaggedError for zero-throw error handling         |
| [Sentry](https://sentry.io/)                                                                                         | Error tracking & performance monitoring                          |

### Frontend

| Technology                                                               | Purpose                                                     |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [React 19](https://react.dev/)                                           | UI library                                                  |
| [TanStack Start](https://tanstack.com/start)                             | Full-stack SSR framework on Cloudflare Workers              |
| [TanStack Router](https://tanstack.com/router)                           | File-based type-safe routing                                |
| [TanStack Query v5](https://tanstack.com/query)                          | Async state management with cross-tab BroadcastChannel sync |
| [TanStack Form](https://tanstack.com/form)                               | Headless form management                                    |
| [BlockNote](https://www.blocknote.dev/)                                  | Block-based rich text editor with AI extensions             |
| [Shadcn/ui](https://ui.shadcn.com/)                                      | Component library (Radix Vega preset)                       |
| [Tailwind CSS v4](https://tailwindcss.com/)                              | Utility-first styling (OKLCH color system)                  |
| [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) | Zero-overhead type-safe i18n (EN, FR, AR + RTL)             |

### Infrastructure & DevOps

| Technology                                                      | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| [Bun](https://bun.sh/)                                          | Package manager, runtime & workspace orchestration    |
| [TypeScript 7](https://www.typescriptlang.org/)                 | Strict-mode static typing with project references     |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Cloudflare CLI for local dev & deployment             |
| [GitHub Actions](https://github.com/features/actions)           | CI/CD pipeline (migrate → deploy-server → deploy-web) |
| [Docker Compose](https://docs.docker.com/compose/)              | Local PostgreSQL 18 + Neon HTTP proxy                 |

---

## Architecture

### Modular Monolith

The backend is a **modular monolith** — a single deployable Cloudflare Worker composed of strictly isolated domain modules. Each domain (workspaces, pages, comments, users, search, AI) owns its own vertical slice through every layer:

```
dotion/
├── packages/shared/        ← Canonical Zod schemas, branded IDs, event contracts
├── packages/db/             ← Drizzle schema + domain-isolated repositories
├── packages/services/       ← Domain service classes + ABAC policy engine
├── packages/auth/           ← Better Auth adapter
└── apps/server/             ← Hono routes, handlers, DOs, queues, events
```

**Strict one-way dependency flow** is enforced across the entire codebase:

```
apps/server  →  packages/services  →  packages/db  →  packages/shared
                       ↑
                  packages/auth
```

Module isolation is maintained at every layer:

- **Repository isolation**: Each repository interacts exclusively with its own domain's tables. Zero cross-domain SQL joins. If a page service needs user data, it calls the user _service_ — never the user _repository_.
- **Service isolation**: Services receive their own repository plus injected companion services via constructor injection. Cross-domain coordination happens through service-to-service calls, never by reaching into another module's data layer.
- **Schema isolation**: Zod schemas and branded ID types (`UserId`, `PageId`, `WorkspaceId`, ...) are defined once in `packages/shared` and imported by all layers, ensuring a single source of truth.

### Event-Driven Architecture & Transactional Outbox

Domain modules communicate asynchronously through a **domain event system** built on the **transactional outbox pattern**:

```
Service mutation
  → DB write + outbox entry (same transaction)
  → Commit
  → DomainEventRouter dispatches event to registered strategies
  → Strategies execute side-effects (WebSocket broadcasts, KV invalidation, queue enqueue)
```

1. **Atomic event recording**: When a service performs a mutation (e.g., creating an invitation), it writes the domain data _and_ an outbox event entry in the same database transaction. If the transaction fails, neither the data nor the event is persisted.

2. **Strategy-based dispatch**: After the transaction commits, the `DomainEventRouter` dispatches the event to the appropriate `DomainEventStrategy`. Each event type has exactly one strategy — no `switch` statements, no `if (type === ...)` chains. 19 event strategies cover the full domain surface:

   ```
   workspace.invitation_created    →  WorkspaceInvitationCreatedStrategy
   workspace.member_joined         →  WorkspaceMemberJoinedStrategy
   workspace.member_removed        →  WorkspaceMemberRemovedStrategy
   page.created                    →  PageCreatedStrategy
   page.moved_to_trash             →  PageMovedToTrashStrategy
   page.restored                   →  PageRestoredStrategy
   page.deleted_permanently        →  PageDeletedPermanentlyStrategy
   page.content_updated            →  PageContentUpdatedStrategy
   comment.created                 →  CommentCreatedStrategy
   comment.resolved                →  CommentResolvedStrategy
   ...and more
   ```

3. **Guaranteed delivery via outbox poller**: If the event dispatch fails (worker crash, network error), a **cron-triggered outbox poller** runs every 2 minutes, queries stale unprocessed events from the outbox table, and redelivers them — guaranteeing **at-least-once** event delivery.

### Queues for Background Jobs

Heavy, latency-insensitive work is offloaded to **Cloudflare Queues** with automatic retries and dead-letter queue (DLQ) protection:

| Queue                      | Trigger                          | What it does                                                                                                                                                                                               |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotion-page-indexing`     | Page content or metadata changes | Chunks document content, generates 1536-dim embeddings (Gemini `gemini-embedding-001`), computes content hashes for diff detection, and upserts `page_sections` with pgvector HNSW + Lakebase BM25 indexes |
| `dotion-page-indexing-dlq` | Indexing failure after 3 retries | Captures failed indexing payloads with stack traces and message IDs for debugging and dead-letter replay                                                                                                   |
| `dotion-page-cleanup`      | Page permanent deletion          | Iterates and deletes all R2 storage assets under the page's prefix (`workspaces/{id}/pages/{id}/*`) via cursor-based batch deletion                                                                        |

Both queues run with batch size 10, 5-second timeout, and 3 max retries before routing to DLQ.

### Agentic RAG Assistant

The workspace AI assistant is not a simple prompt-in/text-out chatbot — it is an **agentic, multi-model RAG system** engineered for high resilience, strict workspace grounding, and low-latency edge inference:

```
User Question
  │
  ├── 1. Quota Verification (UserCreditsDO SQLite Ledger)
  │
  ├── 2. Conversation Window & Progressive Summarization (Gemini 3.1 Flash-Lite ⇄ Groq Compound)
  │      └─ Threads > 8 messages compressed into rolling memory
  │
  ├── 3. Agentic Execution Loop (Vercel AI SDK 7 streamText with Step-Budget Enforcement)
  │      │
  │      ├── High-Resilience Model Failover (ai-fallback)
  │      │     Primary: Google Gemini 3.6 Flash
  │      │     Secondary: Groq OpenAI OSS 120B (60s auto-reset)
  │      │
  │      ├── Dynamic Step Budget & Early Finalization Warning (maxSteps: 10)
  │      │
  │      └── 5 Specialized Workspace Retrieval Tools
  │            ├── searchWorkspace       → Tri-mode search (Balanced RRF / Conceptual / Exact)
  │            ├── readFullPage          → Complete page read (Indexed sections or Yjs binary CRDT)
  │            ├── getPageTree           → Full workspace navigation & hierarchy tree
  │            ├── fetchAdjacentSections → Surrounding section context window
  │            └── getPageBlocks         → Granular BlockNote inspector (tables, code, checklists)
  │
  ├── 4. Grounding & Prompt-Injection Defense
  │      └─ Workspace content isolated as untrusted DATA; early exit on absent information
  │
  └── 5. Streaming Output with Interactive Citations [1][2] + Token Settlement
```

**Key Pipeline Capabilities:**

1. **Multi-Model Edge Fallback (`ai-fallback`)**:
   - **Primary Model**: Google `gemini-3.6-flash` (via `@ai-sdk/google`) — rapid reasoning and strong tool-calling fidelity.
   - **Secondary Model**: Groq `openai/gpt-oss-120b` (via `@ai-sdk/groq`) — low-latency edge failover.
   - **Automatic Failover & Recovery**: Powered by `createFallback`, provider errors or rate limits immediately trigger seamless failover to Groq, resetting back to Gemini after 60 seconds (`modelResetInterval: 60000`).
   - **Dedicated Summarization Pipeline**: Separate lightweight fallback using Google `gemini-3.1-flash-lite` (primary) and Groq `groq/compound` (secondary) for asynchronous thread title generation and conversation memory compression.

2. **Ingestion & Semantic Chunking Engine (`ChunkingService`)**:
   - **BlockNote AST Chunking**: Parses binary Yjs CRDT documents into semantic sections based on heading levels (H1/H2/H3).
   - **Smart Paragraph-Boundary Splitting**: Flat (headingless) documents break cleanly at double-newline paragraph boundaries rather than arbitrary line breaks.
   - **Media Metadata Preservation**: Extracts alt text, captions, and file names from image, video, audio, and file blocks into searchable text embeddings (`[image: alt — name — caption]`).
   - **Sliding Overlap for Retrieval Density**: Prepends 200 characters of preceding section context during embedding generation (`embedBatch`) without bloating stored database text.
   - **Deduplicated Block Mapping**: Exact mapping between sub-chunks and BlockNote `blockId`s for granular block-level citations.
   - **1536-Dimensional Embeddings**: Google `gemini-embedding-001` with exponential backoff and task-type awareness (`RETRIEVAL_DOCUMENT` vs. `RETRIEVAL_QUERY`).

3. **Tri-Mode Hybrid Search Backbone**:
   - `balanced`: **Reciprocal Rank Fusion (RRF, k=60)** combining semantic pgvector HNSW cosine similarity and Lakebase BM25 full-text rank, gated by BM25 scoring when semantic signals are sparse.
   - `conceptual`: Vector-priority search with relaxed similarity threshold for conceptual and thematic exploration.
   - `exact`: Lexical BM25 priority search designed for technical identifiers, UUIDs, error traces, and exact code snippets.

4. **Five Specialized Workspace Tools**:
   - `searchWorkspace` — Multi-mode hybrid search with keyword formulation guidelines and score thresholds.
   - `readFullPage` — Full-document retrieval with dual-path execution (indexed sections or binary Yjs CRDT reconstruction with per-section citations).
   - `getPageTree` — Inspects hierarchical parent/child navigation tree for workspace structure and subpage discovery.
   - `fetchAdjacentSections` — Surrounding section window fetching with verified page title metadata for contextual continuity.
   - `getPageBlocks` — Granular BlockNote block inspector for tables, checklists, code blocks, and specific block IDs with pagination and truncation awareness.

5. **Agentic Loop & Context Optimization**:
   - **Step-Budget Awareness**: Dynamic tool injection tracks remaining agentic execution steps (budget default 10) and warns the LLM to finalize answers before step exhaustion.
   - **Conversation Sliding Window & Progressive Summarization**: Threads exceeding 8 messages are compressed into memory summaries to conserve context window while preserving context continuity.
   - **Prompt Injection Defense**: Untrusted workspace data isolation ensures the agent treats retrieved documents strictly as data, resisting embedded prompt injections.
   - **Early-Exit Heuristic**: Prompt instructions prevent speculative multi-hop fishing when information is absent, exiting cleanly with standardized responses.
   - **Interactive Citations**: Clickable source badges `[N]` linked to specific page headings and block IDs.

6. **Token Quota Management & Edge Ledger**:
   - Per-user token quotas (default 90,000/day) tracked atomically in `UserCreditsDO` SQLite ledger.
   - Pre-stream quota checks (`minTokens: 50`) and post-finish settlement of input + output tokens.

7. **Multi-Thread Conversations**: Users can create, switch between, and delete conversation threads, with full message history (including tool execution traces) persisted in PostgreSQL.

### Real-Time Infrastructure (Durable Objects)

Four Durable Object classes power all real-time features using the **WebSocket Hibernation API**:

| Durable Object      | Key           | Responsibility                                                                                                                                  |
| ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`WorkspacesDO`**  | `workspaceId` | Workspace-level broadcasts: page tree mutations, member joins/removals, role changes, invitation events, targeted user eviction                 |
| **`PagesDO`**       | `pageId`      | Yjs CRDT sync (binary protocol), collaborator presence/cursors, comment thread events, debounced persistence with alarm-driven PostgreSQL flush |
| **`UsersDO`**       | `userId`      | Real-time notification delivery, cross-tab read state synchronization                                                                           |
| **`UserCreditsDO`** | `userId`      | AI token quota tracking with SQLite ledger, daily allowance resets, atomic check-and-settle                                                     |

### Request Lifecycle

```
HTTP Request
  → CORS / CSRF / secureHeaders middlewares
  → Rate Limiting (Cloudflare binding-based: 10/200/15 req per minute)
  → currentUserMiddleware (Better Auth session validation)
  → requirePermission (ABAC policy evaluation + KV-cached decisions)
  → OpenAPI route (Zod-validated params/query/body)
  → Handler (thin adapter — zero business logic, zero DB queries)
  → Service (orchestrates domain logic, transactions, event dispatch)
  → Repository (isolated domain DB queries)
```

### Frontend Architecture

```
Route loader (preloads data)
  → Suspense boundary + Skeleton loading fallback
  → Feature component (useSuspenseQuery / useQuery)
  → Feature API class (returns Result<T, E>)
  → Hono RPC client
  → Cloudflare Service Binding (zero-latency worker-to-worker)
  → Backend endpoints
```

**Tab-leader WebSocket architecture**: The `WebSocketClient` uses the **Web Locks API** for leader election — only one browser tab holds the real WebSocket connection to the Durable Object. All other tabs receive messages through a `BroadcastChannel`. When a follower tab needs to send a message, it posts to the channel and the leader relays it through the socket with acknowledgment.

---

## Design Patterns & Code Style

### Result Monad (Zero `throw` Across Boundaries)

All async operations return `Result<T, E>` from `better-result` instead of throwing. Errors are typed, tagged, and exhaustively matched:

```typescript
// Repository — catches errors, returns Result
async createPage(tx: AppDB, input: CreatePageInput): Promise<Result<Page, DatabaseError>> {
  try {
    const [row] = await tx.insert(pages).values(input).returning();
    if (!row) return Result.err(new DatabaseError({ message: "Failed to create page" }));
    return Result.ok(row);
  } catch (error) {
    console.error("PagesRepository.createPage error:", error);
    return Result.err(new DatabaseError({ message: "Failed to create page" }));
  }
}

// Handler — exhaustive error matching
if (result.isErr()) {
  return result.error.match({
    DatabaseError: () => c.json(errorResponseJson("Internal error"), 500),
    NotFoundError: () => c.json(errorResponseJson("Not found"), 404),
  });
}
```

### Result.gen — Monadic Generator Pipelines

Multi-step workflows use `Result.gen` to compose fallible operations without repetitive `if (result.isErr())` checks:

```typescript
async inviteMember(workspaceId, inviterId, input) {
  return Result.gen(async function* (this: WorkspacesService) {
    const targetUser = yield* Result.await(this.usersService.getUserByEmail(input.email));

    const [workspace, isAlreadyMember] = yield* Result.await(
      Result.allAsync([
        this.workspacesRepository.getWorkspaceOnly(workspaceId),
        this.workspacesRepository.isMember(workspaceId, targetUser.id),
      ])
    );

    if (isAlreadyMember) {
      yield* new DatabaseError({ message: "User is already a member" });
    }

    // Transaction + outbox event in same atomic boundary
    const txResult = yield* Result.await(
      this.dbClient.transaction(async (tx) => { /* ... */ })
    );

    // Side-effects after commit
    await Promise.all([
      this.workspaceEventPublisher?.broadcastInvitationCreated(workspaceId, txResult),
      this.userEventPublisher?.broadcastNotification(targetUser.id, txResult.notification),
    ]);

    return Result.ok(txResult.invitation);
  }, this);
}
```

### Dependency Injection (Manual Constructor Injection)

The entire service graph is wired per-request in a single factory (`createAppContext`). No DI container — just explicit constructor injection:

```typescript
function createAppContext(env: Env, ctx: ExecutionContext) {
  const dbClient = createDb(env.DATABASE_URL);
  const pagesRepo = new PagesRepository(dbClient);
  const pageEventPublisher = new DurableObjectPageEventPublisher(env, ctx);
  const pageCleanupQueue = new CloudflarePageCleanupQueue(env);

  const pagesService = new PagesService(
    pagesRepo,
    workspacesService,
    dbClient,
    pageEventPublisher,
    pageCleanupQueue,
  );

  return { services: { pages: pagesService /* ... */ } };
}
```

### Strategy Pattern (Zero `switch` / Zero `if-else`)

The codebase bans `switch` and `if (type === ...)` chains. All type-based dispatch uses typed strategy registries:

```typescript
// Backend — WebSocket routing
const router = new WsRouter<PageContext>();
router.register(new YjsSyncStep1Strategy());
router.register(new PageMetadataUpdateStrategy());

// Backend — Domain events
const eventRouter = new DomainEventRouter();
eventRouter.register(new PageCreatedStrategy());
eventRouter.register(new CommentCreatedStrategy());

// Frontend — WebSocket handlers
const WORKSPACE_WS_STRATEGIES = {
  "page.created": (payload, ctx) => {
    /* invalidate queries */
  },
  "member.joined": (payload, ctx) => {
    /* update member list */
  },
} satisfies Record<WorkspaceEventType, StrategyHandler>;
```

### Branded Types

Compile-time type safety prevents ID confusion:

```typescript
export const userId = z.string().brand("UserId");
export const workspaceId = z.uuid().brand("WorkspaceId");
export const pageId = z.uuid().brand("PageId");
// A WorkspaceId can never be accidentally passed where a PageId is expected
```

### Advanced TanStack Query & Router Patterns

The frontend integrates TanStack Query v5 with TanStack Router using robust state management and preloading patterns:

#### 1. Monadic Result Adapters (`resultQueryOptions` & `resultMutationOptions`)

To maintain zero raw exception throwing across frontend layers, API calls return `Result<T, E>` monads. Query options wrap these calls so TanStack Query handles success (`T`) while throwing tagged errors (`E`) directly to React Error Boundaries or UI toast notifications:

```typescript
// query-options.ts — Query key factory + monadic wrapper
export const pagesKeys = {
  all: ["pages"] as const,
  tree: (workspaceId: WorkspaceId) =>
    [...pagesKeys.all, "tree", workspaceId] as const,
  detail: (pageId: PageId) => [...pagesKeys.all, "detail", pageId] as const,
};

export function pageDetailQueryOptions(
  workspaceId: WorkspaceId,
  pageId: PageId,
) {
  return resultQueryOptions({
    queryKey: pagesKeys.detail(pageId),
    queryFn: () => pagesApi.getPage(workspaceId, pageId),
  });
}
```

#### 2. Route Preloading & Parallel Background Fetching

TanStack Router `loader` functions preload data before navigation completes, combining **critical blocking prefetching** with **non-blocking parallel background prefetches**:

```typescript
export const Route = createFileRoute(
  "/app/workspaces/$workspaceId/pages/$pageId/",
)({
  loader: async ({ context: { queryClient }, params }) => {
    // 1. Parallel background prefetches (non-blocking)
    void queryClient.query(workspaceDetailQueryOptions(params.workspaceId));
    void queryClient.infiniteQuery(
      commentsInfiniteQueryOptions(params.workspaceId, params.pageId),
    );
    void queryClient.query(
      canQueryOptions({
        resource: { type: "page", id: { pageId: params.pageId } },
        action: "update",
      }),
    );

    // 2. Critical main query prefetch (blocking route transition until resolved or 404)
    try {
      await queryClient.query(
        pageDetailQueryOptions(params.workspaceId, params.pageId),
      );
    } catch (error) {
      if (PageNotFoundError.is(error)) throw notFound();
    }
  },
  component: PageRouteComponent,
});
```

#### 3. Optimistic Updates with Automatic Rollback (`onMutate` / `onError`)

Mutations optimistically update the query cache before the server responds, snapshotting previous state for instant UI response and automatic rollback if the request fails:

```typescript
export function useMoveToTrash() {
  const queryClient = useQueryClient();
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: MoveToTrashInput) => pagesApi.moveToTrash(input),
      onMutate: async (variables) => {
        // Cancel active refetches to prevent cache race conditions
        await queryClient.cancelQueries({
          queryKey: pagesKeys.tree(variables.workspaceId),
        });
        await queryClient.cancelQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        });

        // Snapshot previous state for rollback
        const previousTree = queryClient.getQueryData(
          pagesKeys.tree(variables.workspaceId),
        );
        const previousTrash = queryClient.getQueryData(
          pagesKeys.trash(variables.workspaceId),
        );

        // Optimistically update query cache
        queryClient.setQueryData(pagesKeys.tree(variables.workspaceId), (old) =>
          removePageAndDescendantsFromTree({
            oldTree: old,
            pageId: variables.pageId,
          }),
        );
        queryClient.setQueryData(
          pagesKeys.trash(variables.workspaceId),
          (old) =>
            addPageToTrash({
              oldTrash: old,
              trashed: { id: variables.pageId /* ... */ },
            }),
        );

        return { previousTree, previousTrash };
      },
      onError: (error, variables, context) => {
        // Rollback on failure
        if (context?.previousTree)
          queryClient.setQueryData(
            pagesKeys.tree(variables.workspaceId),
            context.previousTree,
          );
        if (context?.previousTrash)
          queryClient.setQueryData(
            pagesKeys.trash(variables.workspaceId),
            context.previousTrash,
          );
        toast.error(error?.message ?? "Failed to move page to trash");
      },
    }),
  );
}
```

### ABAC Authorization

A pure **Attribute-Based Access Control** engine with zero I/O in policy evaluation:

1. **Attribute loader** fetches resource attributes from domain services
2. **Pure policies** evaluate synchronous predicates (`isWorkspaceOwner`, `isPageEditor`, `isPageViewer`) against loaded attributes
3. **KV cache** stores decisions with 60-second TTL, instantly invalidated on permission changes
4. **Declarative route binding** via `createAuthorizedRoute` — permissions are declared in the route definition, not scattered in handler code

---

## Features

### 📝 Rich Document Editor

- Block-based editor powered by [BlockNote](https://www.blocknote.dev/) with slash commands, drag-and-drop, nested pages, and media embeds.
- Real-time collaboration via Yjs CRDTs — multiple users edit simultaneously with live cursors and presence awareness.
- Custom page metadata: emoji icons, Unsplash cover images, and customizable document canvas backgrounds.
- Math equations (KaTeX), GFM Markdown, and syntax-highlighted code blocks.

### 🤖 AI-Powered Features

- **In-editor AI**: Contextual writing tools via slash menu or text selection — rewrite, improve, translate (AR/FR/EN), summarize, change tone, brainstorm, continue writing, fix grammar.
- **Agentic RAG Assistant**: Multi-model fallback (Google Gemini 3.6 Flash ⇄ Groq GPT-OSS-120B), 5 workspace retrieval tools, hybrid RRF search, per-section citations, progressive conversation summarization, and token quota tracking.
- **Tri-Mode Hybrid Search**: Balanced (hybrid RRF), Conceptual (semantic vector), and Exact (lexical/BM25). Triggered globally via `Cmd+K`.

### 🌐 Real-Time Collaboration

- WebSocket-based live updates via Durable Objects for document editing, workspace events, comment threads, and notifications.
- Tab-leader election via Web Locks API — one tab holds the socket, all others sync via BroadcastChannel.
- Live presence with colored cursors and user avatars.

### 🏢 Workspace Management

- Multi-workspace support with team invitations, role management (owner/admin/member), and member directory.
- Hierarchical page tree with drag-and-drop reordering.
- Trash with full subtree restoration or permanent deletion (with automatic R2 asset cleanup).

### 💬 Comments & Threads

- Page-level comment threads with real-time synchronization, replies, and resolution.

### 🔐 Authentication & Authorization

- Multi-provider auth: email/password + Google + GitHub via Better Auth.
- ABAC policy engine with fine-grained page sharing (viewer/editor permissions, access request workflows).
- KV-cached authorization decisions with instant invalidation.

### 🌍 Internationalization

- Tri-lingual support: English, French, Arabic with full RTL layout, CSS logical properties, and Noto Sans Arabic typography.
- Zero-overhead type-safe i18n via Paraglide.js with URL-pattern localization (`/ar/*`, `/fr/*`).

### 🎨 Theming & Responsive Design

- Light / Dark / System theme with anti-FOUC prevention.
- OKLCH color system with comprehensive design tokens.
- Responsive: Desktop uses Radix dialogs; mobile switches to Vaul bottom drawers.

### 📱 Progressive Web App

- Installable on desktop and mobile with service worker updates and offline/online detection.

### 📊 Observability

- Full Sentry integration on both backend and frontend for error tracking, performance monitoring, and source map uploads.

---

## Project Structure

```
dotion/
├── apps/
│   ├── server/                    # Cloudflare Worker — Hono + OpenAPI backend
│   │   ├── src/
│   │   │   ├── app.ts             # App factory & route registration
│   │   │   ├── context.ts         # DI factory — wires the entire service graph
│   │   │   ├── index.ts           # Worker entry (fetch + queue + scheduled)
│   │   │   ├── lib/               # create-app, create-authorized-route, ws-router
│   │   │   ├── routes/            # Domain modules (workspaces, pages, users, ...)
│   │   │   ├── queues/            # Queue consumers (indexing, cleanup)
│   │   │   ├── scheduled/         # Cron handlers (outbox poller)
│   │   │   └── events/            # Domain event router & strategies
│   │   ├── wrangler.jsonc         # Cloudflare bindings (DO, KV, R2, Queues, Crons)
│   │   └── docker-compose.yml     # Local PostgreSQL + Neon proxy
│   │
│   └── web/                       # TanStack Start — React frontend
│       ├── src/
│       │   ├── routes/            # File-based routes with auth guards
│       │   ├── features/          # Domain feature modules (10 domains)
│       │   ├── components/        # Shared UI (ai-elements, common, pwa)
│       │   ├── lib/               # WebSocket client, auth client, API client
│       │   └── styles.css         # Tailwind v4 theme (OKLCH design tokens)
│       └── messages/              # Paraglide i18n translations (en, fr, ar)
│
├── packages/
│   ├── shared/                    # Zod schemas, branded IDs, event contracts
│   ├── db/                        # Drizzle schema + domain-isolated repositories
│   ├── services/                  # Domain services + ABAC policies + port interfaces
│   └── auth/                      # Better Auth adapter (providers, KV, Drizzle)
│
├── .github/workflows/deploy.yml   # CI/CD: migrate → deploy-server → deploy-web
├── AGENTS.md                      # Engineering contract & architectural guidelines
└── package.json                   # Bun workspaces + dependency catalog
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- [Docker](https://www.docker.com/) & Docker Compose (for local PostgreSQL)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare CLI)
- A [Cloudflare](https://cloudflare.com/) account (Workers, KV, R2, Queues, Durable Objects)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/dotion.git
cd dotion
bun install
```

### 2. Start Local Database

```bash
cd apps/server
docker compose up -d
```

Starts PostgreSQL 18 and a local Neon HTTP proxy on port `4444`.

### 3. Configure Environment

```bash
cp apps/server/.env.example apps/server/.env
```

| Variable                       | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `DATABASE_URL`                 | Neon-compatible PostgreSQL connection string                         |
| `BETTER_AUTH_URL`              | Auth callback URL (e.g., `http://localhost:8787`)                    |
| `BETTER_AUTH_SECRET`           | Random secret for session signing                                    |
| `CORS_ORIGIN`                  | Frontend URL (e.g., `http://localhost:3002`)                         |
| `GITHUB_CLIENT_ID` / `SECRET`  | GitHub OAuth app credentials                                         |
| `GOOGLE_CLIENT_ID` / `SECRET`  | Google OAuth credentials                                             |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key (embeddings, Gemini 3.6 Flash, Gemini 3.1 Flash-Lite) |
| `GROQ_API_KEY`                 | Groq API key (GPT-OSS-120B fallback, Groq Compound summary fallback) |

### 4. Push Database Schema

```bash
cd apps/server
bun run db:push
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
bun run dev:server

# Terminal 2 — Frontend (port 3002)
bun run dev:web
```

### 6. Type Checking

```bash
bun run typecheck
```

---

## Deployment

Deploys via **GitHub Actions** on push to `main` in three sequential stages:
Production deployments are automated via **GitHub Actions** (`.github/workflows/deploy.yml`) on every push to `main` or via manual trigger (`workflow_dispatch`).

### GitHub Actions CI/CD Architecture

```
1. migrate        →  Pushes Drizzle schema to production Neon database
2. deploy-server  →  Deploys backend Worker via wrangler deploy
3. deploy-web     →  Builds TanStack Start app & deploys frontend Worker
push to main
  │
  ├── 1. Job: migrate (Drizzle DB Push)
  │      └─ Applies database schema alterations to production Neon PostgreSQL (bun run db:push)
  │
  ├── 2. Job: deploy-server (needs: migrate)
  │      └─ Deploys Hono OpenAPI Worker via cloudflare/wrangler-action@v4
  │         Injects 12 Cloudflare secrets (Neon DB, Better Auth, Gemini, Groq, Sentry)
  │
  └── 3. Job: deploy-web (needs: migrate)
         ├─ Compiles TanStack Start React SPA + uploads Sentry sourcemaps
         └─ Deploys Frontend Worker via cloudflare/wrangler-action@v3
```

Both Workers run on Cloudflare's global edge. The frontend uses a **service binding** (`BACKEND`) for zero-latency, in-datacenter backend calls.

#### Key Pipeline Features:

1. **Concurrency Control**:
   - `concurrency.group: deploy-production` with `cancel-in-progress: false`.
   - Guarantees sequential deployment execution without aborting in-flight DB migrations or deploying out-of-order build artifacts.

2. **Stage 1 — Database Migrations (`migrate`)**:
   - Runs in `apps/server` using `bun run db:push` against production `DATABASE_URL`.
   - Schema updates are applied and verified before server application code updates deploy.

3. **Stage 2 — Backend Deployment (`deploy-server`)**:
   - Uses `cloudflare/wrangler-action@v4` with `bun-version: latest`.
   - Securely injects production secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `SENTRY_SERVER_DSN`, etc.).

4. **Stage 3 — Frontend Build & Deploy (`deploy-web`)**:
   - Builds TanStack Start SPA with production Sentry release tracking and source map uploads (`VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`).
   - Uses `cloudflare/wrangler-action@v3` to deploy to Cloudflare Workers with direct **service bindings** (`BACKEND`) for zero-latency, worker-to-worker API calls.

### Rate Limits

| Endpoint             | Limit   | Window |
| -------------------- | ------- | ------ |
| Auth (`/api/auth/*`) | 10 req  | 60s    |
| API (`/api/v1/*`)    | 200 req | 60s    |
| AI generation        | 15 req  | 60s    |

---
