# Loreland

A turn-based interactive storytelling platform where creators design worlds and players explore them through AI-driven narratives.

## What is Loreland?

**For Creators**: Design immersive worlds with custom characters, NPCs, game states, and triggers. Define how the story unfolds—set victory conditions, craft narrative styles, and control what players can see or modify.

**For Players**: Choose a character and take actions in a living world. Each turn, the AI generates consequences based on your choices, the world's rules, and hidden triggers—until you reach victory or defeat.

### Key Concepts

- **World Description**: The setting, rules, and context of your game
- **States**: Tracked variables like health, mood, inventory, or world conditions (visible, hidden, or conditional)
- **Triggers**: Dynamic events that change the narrative when conditions are met (e.g., "player eats apple → narrator becomes sarcastic")
- **Characters & NPCs**: Playable characters with skills and non-player characters that inhabit the world

## Architecture

```
loreland/
├── apps/
│   ├── api/          # Hono API (Cloudflare Workers)
│   └── web/          # TanStack Start frontend (Cloudflare Pages)
└── packages/
    └── db/           # Drizzle ORM schemas
```

### Tech Stack

- **Database**: Cloudflare D1 (SQLite) for game definitions
- **Agents**: Cloudflare Agents with embedded SQLite (per-session gameplay)
- **Storage**: Cloudflare R2 for generated images
- **Auth**: Better Auth with Drizzle adapter
- **ORM**: Drizzle ORM with type-safe schemas

### Data Model

**D1 Central Database**:
- Games, characters, NPCs, lorebook entries
- States (tracked variables with visibility control)
- Triggers (conditional behavior modifiers)

**Agent SQLite (per session)**:
- Session states (live values copied from D1, updated during play)
- Session triggers (track fired triggers for one-shot events)
- Turns with state snapshots and triggered actions
- Messages, rolling summary, and image references

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

## Design System

Loreland features a distinct "Research/Canvas" aesthetic designed to feel like a premium digital archive or laboratory journal.

### Visual Language
- **Typography**:
  - **Headings**: `Lora` (Serif) - Adds an academic, story-rich feel to titles and "World" names.
  - **Body**: `DM Sans` (Sans-serif) - Ensures clean, modern readability for UI elements and long descriptions.
- **Color Palette**: "Warm Paper" theme.
  - Backgrounds: Soft off-white (`#fcfbf9`) warmth.
  - Accents: Pastel headers for cards (deterministic based on ID) and sleek monochrome UI elements.
- **Iconography**: `Phosphor Icons` (Bold/Fill weights) for a robust, consistent look.

### Core Components
- **Game Cards**: Large, spacious cards with pastel headers, decorative typography, and dashed borders, resembling research dossiers.
- **Buttons**:
  - **Dashed**: A signature style for secondary actions, mimicking dotted lines on paper.
  - **Solid Pill**: Primary actions (e.g., "Start New World") use a high-contrast pill shape for clear affordance.
- **Header**: Ultra-compact (`h-12`) with a blurred background and subtle "L" logo, keeping focus on the content.

