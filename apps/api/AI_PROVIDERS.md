# AI Providers Configuration

This document explains how to configure AI providers for the Loreland API backend.

## Overview

The backend uses Vercel AI SDK with a flexible provider architecture that supports:

1. **Direct Gemini Access**: Connect directly to Google's Gemini API
2. **Vercel AI Gateway**: Route requests through Vercel's AI Gateway for enhanced observability and caching

## Configuration

### Environment Variables

Set these environment variables in `wrangler.jsonc` (vars section) and as secrets:

#### Required for All Providers

```bash
# Set the Gemini API key as a secret
wrangler secret put GEMINI_API_KEY
```

#### Optional Configuration

```jsonc
// In wrangler.jsonc vars section
{
  "AI_PROVIDER": "gemini",  // or "vercel-gateway"
  "AI_MODEL": "gemini-2.0-flash-exp"  // or any Gemini model
}
```

### Provider Modes

#### 1. Direct Gemini (Default)

This is the default mode that connects directly to Google's Gemini API.

**Configuration:**
```jsonc
{
  "AI_PROVIDER": "gemini",
  "AI_MODEL": "gemini-2.0-flash-exp"
}
```

**Setup:**
```bash
# Set your Gemini API key
wrangler secret put GEMINI_API_KEY
# Enter your API key when prompted
```

**Pros:**
- Simple setup
- Direct access to latest models
- No additional infrastructure required

**Cons:**
- No built-in caching
- Limited observability
- No request routing or fallbacks

#### 2. Vercel AI Gateway

Route requests through Vercel's AI Gateway for enhanced features.

**Configuration:**
```jsonc
{
  "AI_PROVIDER": "vercel-gateway",
  "AI_MODEL": "gemini-2.0-flash-exp",
  "VERCEL_AI_GATEWAY_URL": "https://your-gateway.vercel.app/api/gateway"
}
```

**Setup:**
1. Deploy a Vercel AI Gateway endpoint (see Vercel AI SDK docs)
2. Configure the gateway URL
3. Set your Gemini API key:
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```

**Pros:**
- Request caching
- Enhanced observability and analytics
- Request routing and fallbacks
- Cost tracking per project/user

**Cons:**
- Requires additional Vercel infrastructure
- Slightly higher latency
- Additional configuration needed

## Usage in Code

The AI service is automatically configured based on environment variables. No code changes needed to switch providers!

### Example: Game Generation Workflow

```typescript
import { AIService } from "../services/ai";
import { createAIConfig, getLanguageModel } from "../lib/ai-config";

// Initialize AI service (provider determined by env vars)
const aiConfig = createAIConfig(this.env);
const model = getLanguageModel(aiConfig);
const aiService = new AIService(model);

// Generate structured output
const metadata = await aiService.generateObject({
    schema: aiGameMetadataSchema,
    systemPrompt: "You are a creative game designer...",
    prompt: "Create a fantasy RPG game",
});

// Generate array of items
const characters = await aiService.generateArray({
    itemSchema: aiCharacterSchema,
    count: 3,
    systemPrompt: "You are a character designer...",
    prompt: "Create diverse characters for the game",
});
```

### Example: Standalone Usage (Cloudflare Agents)

```typescript
import { AIService } from "@/services/ai";
import { createAIConfig, getLanguageModel } from "@/lib/ai-config";

// In your agent code
const aiConfig = createAIConfig({
    AI_PROVIDER: env.AI_PROVIDER,
    AI_MODEL: env.AI_MODEL,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    VERCEL_AI_GATEWAY_URL: env.VERCEL_AI_GATEWAY_URL,
});

const model = getLanguageModel(aiConfig);
const ai = new AIService(model);

// Use the service
const response = await ai.generateText({
    prompt: "What's the weather like?",
});
```

## Available Models

### Gemini Models

- `gemini-2.0-flash-exp` - Latest experimental flash model (default)
- `gemini-1.5-flash` - Stable flash model
- `gemini-1.5-pro` - Most capable model

See [Google AI Studio](https://ai.google.dev/) for the latest available models.

## Switching Providers

To switch from direct Gemini to Vercel AI Gateway (or vice versa):

1. Update `AI_PROVIDER` in `wrangler.jsonc`
2. Add `VERCEL_AI_GATEWAY_URL` if using gateway
3. Deploy with `wrangler deploy`

**No code changes required!** The same codebase works with both providers.

## Troubleshooting

### "GEMINI_API_KEY is required" Error

Make sure you've set the secret:
```bash
wrangler secret put GEMINI_API_KEY
```

### "VERCEL_AI_GATEWAY_URL is required" Error

When using `AI_PROVIDER=vercel-gateway`, you must set the gateway URL in `wrangler.jsonc` vars.

### Model Not Found Error

Verify the model name is correct. Check Google AI Studio for available models.

### Gateway Connection Issues

- Verify your Vercel AI Gateway is deployed and accessible
- Check that the gateway URL is correct
- Ensure the gateway is properly configured with Gemini provider

## Best Practices

1. **Development**: Use direct Gemini for faster iteration
2. **Production**: Use Vercel AI Gateway for enhanced observability
3. **API Keys**: Always use secrets, never commit keys to git
4. **Model Selection**: Start with flash models for speed, use pro for complex tasks
5. **Error Handling**: The AI service automatically handles retries and errors

## Future Enhancements

Potential additions to the provider system:

- OpenAI provider support
- Anthropic Claude support
- Multiple provider failover
- Dynamic provider selection based on task
- Request caching layer
- Rate limiting and quota management
