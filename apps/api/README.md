# Loreland API

Backend API for the Loreland game generation platform.

## Quick Start

### Prerequisites

- Bun installed
- Wrangler CLI
- Google Gemini API key

### Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up your Gemini API key:**
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```
   
   Get your API key from [Google AI Studio](https://ai.google.dev/).

3. **Run locally:**
   ```bash
   bun run dev
   ```

### AI Provider Configuration

The API uses Vercel AI SDK with flexible provider support. By default, it connects directly to Gemini API.

**Current Configuration** (in `wrangler.jsonc`):
- Provider: Direct Gemini
- Model: `gemini-2.0-flash-exp`

To switch providers or models, see [`AI_PROVIDERS.md`](./AI_PROVIDERS.md) for detailed configuration options.

### Database Setup

```bash
# Generate database migrations
bun run db:generate

# Apply migrations (local)
bun run db:migrate

# Apply migrations (remote)
bun run db:migrate:remote
```

### Deployment

```bash
bun run deploy
```

## Project Structure

```
src/
├── lib/
│   ├── ai-config.ts       # AI provider configuration
│   ├── schemas.ts         # Zod schemas for validation
│   └── ...
├── services/
│   ├── ai.ts              # AI service abstraction
│   ├── games.ts           # Game data service
│   └── images.ts          # Image generation service
├── workflows/
│   └── game-generation.ts # Durable workflow for game gen
├── routes/
│   └── ...                # API routes
└── index.ts               # Main entry point
```

## Key Features

- **AI-Powered Game Generation**: Uses Gemini to create game metadata, characters, and NPCs
- **Image Generation**: Leverages Cloudflare Workers AI (Flux) for game artwork
- **Durable Workflows**: Long-running game generation with progress tracking
- **Semantic Search**: Vectorize integration for game discovery
- **Type-Safe**: Full TypeScript with generated types from Wrangler

## Documentation

- 📚 [AI Providers Configuration](./AI_PROVIDERS.md) - Detailed AI setup guide
- 🔧 Database Schema - See packages/db
- 🎮 API Routes - See src/routes

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes (secret) | - |
| `AI_PROVIDER` | AI provider to use | No | `gemini` |
| `AI_MODEL` | Gemini model name | No | `gemini-2.0-flash-exp` |
| `VERCEL_AI_GATEWAY_URL` | Vercel AI Gateway endpoint | Only for gateway mode | - |

## Development Commands

```bash
# Start dev server
bun run dev

# Generate TypeScript types from Wrangler config
bun run cf-typegen

# Generate database schema
bun run db:generate

# Apply database migrations (local D1)
bun run db:migrate

# Apply database migrations (remote D1)
bun run db:migrate:remote

# Deploy to Cloudflare
bun run deploy
```

## Architecture

The backend uses:
- **Cloudflare Workers**: Serverless runtime
- **Hono**: Fast web framework
- **Drizzle ORM**: Type-safe database access
- **D1**: SQLite database
- **R2**: Object storage for images
- **Workers AI**: On-platform AI (Flux for images, BGE for embeddings)
- **Vercel AI SDK**: Unified LLM interface (Gemini for text generation)
- **Workflows**: Durable execution for multi-step processes
- **Vectorize**: Vector database for semantic search

## Support

For issues or questions, see the main project README.
