# Loreland

A game platform where users design interactive adventure games and play them through AI agent conversations.

## Architecture

```
loreland/
├── apps/
│   ├── api/          # Hono API with Better Auth (Cloudflare Workers)
│   └── web/          # TanStack Start frontend (Cloudflare Pages)
└── packages/
    └── db/           # Drizzle ORM schemas and auth config
```

### Tech Stack

- **Auth**: Better Auth with Drizzle adapter (anonymous, email/password, Google OAuth)
- **Database**: Cloudflare D1 (SQLite) for central data
- **Agents**: Cloudflare Agents with embedded SQLite (per-session)
- **Storage**: Cloudflare R2 for generated images
- **ORM**: Drizzle ORM with type-safe schemas

### Database Design

**D1 Central Database**:
- Users, sessions, accounts (via Better Auth)
- Games, characters, NPCs, lore, tracked items
- Victory/defeat conditions, trigger events

**Agent SQLite (per session)**:
- Messages and conversation history
- Rolling summary for context management
- Image references and agent run tracking

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Cloudflare account

### Installation

```bash
# Install dependencies
bun install

# Create D1 database
cd apps/api
bunx wrangler d1 create loreland
# Update wrangler.jsonc with the database_id

# Create R2 bucket
bunx wrangler r2 bucket create loreland-images

# Generate Drizzle migrations
cd ../../packages/db
bun run db:generate

# Apply migrations
cd ../../apps/api
bun run db:migrate
```

### Development

```bash
# Run API
cd apps/api
bun run dev

# Run Web (in another terminal)
cd apps/web
bun run dev
```

### Environment Variables

Set these as Wrangler secrets:

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put AUTH_BASE_URL  # https://api.loreland.dev
```

## Package Structure

### @packages/db

Exports:
- `@packages/db/auth` - Better Auth configuration
- `@packages/db/schema/d1` - D1 tables (games, characters, etc.)
- `@packages/db/schema/agent` - Agent SQLite tables (messages, etc.)
- `@packages/db/types` - TypeScript types for frontend

### Apps

- **api**: Hono-based REST API with auth endpoints
- **web**: TanStack Start with React 19

## Design Decisions

1. **Drizzle ORM everywhere**: Same ORM for D1 and Agent SQLite via `drizzle-orm/d1` and `drizzle-orm/durable-sqlite`

2. **Better Auth over Clerk**: Self-hosted, no external dependency, works with Drizzle adapter

3. **Agent per session**: Each game session gets its own Cloudflare Agent with isolated SQLite storage for zero-latency conversation access

4. **Rolling summary**: Instead of sending full history to LLM, we maintain a summary + last N messages to manage context window

5. **R2 for images**: Generated images stored in R2, referenced in messages by key
