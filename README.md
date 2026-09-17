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

Heavy, latency-insensitive work is offloaded to **Cloudflare Queues** with automatic retries:

| Queue                  | Trigger                          | What it does                                                                                                                                                                                        |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotion-page-indexing` | Page content or metadata changes | Chunks document content, generates 1536-dim embeddings (Gemini `embedding-001`), computes content hashes for diff detection, and upserts `page_sections` with pgvector HNSW + Lakebase BM25 indexes |
| `dotion-page-cleanup`  | Page permanent deletion          | Iterates and deletes all R2 storage assets under the page's prefix (`workspaces/{id}/pages/{id}/*`) via cursor-based batch deletion                                                                 |

Both queues run with batch size 10, 5-second timeout, and 3 max retries.

### Agentic RAG Assistant

The workspace AI assistant is not a simple prompt-in/text-out chatbot — it's an **agentic RAG system** with full tool-calling access to the entire workspace:

```
User question
  → AI SDK streamText
  → Agent decides which tools to call
  → Tool execution (search_workspace, get_page, get_page_hierarchy, read_page_section)
  → Results fed back as context
  → Agent reasons over retrieved content
  → Grounded response with interactive citations
```

**How it works:**

1. **Tool-calling agent loop**: Using Vercel AI SDK 7's `streamText` with `isStepCount` stopping conditions, the assistant autonomously decides when to search, what pages to read, and how deeply to explore the workspace hierarchy. It's not limited to a single retrieval — it can chain multiple tool calls to cross-reference documents.

2. **Four workspace tools** give the agent complete read access:
   - `search_workspace` — Hybrid search (semantic + lexical) across all indexed pages
   - `get_page` — Retrieve a specific page's full content
   - `get_page_hierarchy` — Navigate the workspace's page tree structure
   - `read_page_section` — Read a specific section of a document for fine-grained context

3. **Hybrid search backbone**: Search queries combine **pgvector HNSW** cosine similarity (semantic) with **Lakebase BM25** full-text search (lexical), fused via **Reciprocal Rank Fusion (RRF)** with BM25 gating when semantic similarity scores are low.

4. **Strict RAG grounding**: A system prompt enforces that the assistant only answers based on retrieved workspace content — no hallucination from pre-trained knowledge. Every claim is backed by a citation.

5. **Interactive citations**: Responses include clickable source chips that navigate to the cited page and scroll directly to the specific heading block .

6. **Token quota management**: Each user has a daily token allowance (default 90,000) tracked by a dedicated `UserCreditsDO` Durable Object with an append-only SQLite ledger. The agent checks quota before streaming and settles actual token usage on completion.

7. **Multi-thread conversations**: Users can create, switch between, and delete conversation threads, with full message history (including tool execution traces) persisted in PostgreSQL.

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
- **Workspace AI chat**: Agentic RAG assistant with tool-calling, multi-turn threads, interactive citations, and credit quota tracking.
- **Hybrid search**: Three modes — Balanced (hybrid RRF), Conceptual (semantic/vector), and Exact (lexical/BM25). Triggered globally via `Cmd+K`.

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

| Variable                       | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `DATABASE_URL`                 | Neon-compatible PostgreSQL connection string      |
| `BETTER_AUTH_URL`              | Auth callback URL (e.g., `http://localhost:8787`) |
| `BETTER_AUTH_SECRET`           | Random secret for session signing                 |
| `CORS_ORIGIN`                  | Frontend URL (e.g., `http://localhost:3002`)      |
| `GITHUB_CLIENT_ID` / `SECRET`  | GitHub OAuth app credentials                      |
| `GOOGLE_CLIENT_ID` / `SECRET`  | Google OAuth credentials                          |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key (embeddings)                       |
| `GROQ_API_KEY`                 | Groq API key (AI features)                        |

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

```
1. migrate        →  Pushes Drizzle schema to production Neon database
2. deploy-server  →  Deploys backend Worker via wrangler deploy
3. deploy-web     →  Builds TanStack Start app & deploys frontend Worker
```

Both Workers run on Cloudflare's global edge. The frontend uses a **service binding** (`BACKEND`) for zero-latency, in-datacenter backend calls.

### Rate Limits

| Endpoint             | Limit   | Window |
| -------------------- | ------- | ------ |
| Auth (`/api/auth/*`) | 10 req  | 60s    |
| API (`/api/v1/*`)    | 200 req | 60s    |
| AI generation        | 15 req  | 60s    |

---
