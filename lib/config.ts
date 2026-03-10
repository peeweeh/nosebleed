// Config loader — reads from environment variables.
// Set these in .env.local (gitignored). See .env.local.example for reference.
//
// AI_PROVIDER=openai   → OpenAI-compatible endpoint (custom or cloud)
// AI_PROVIDER=bedrock  → AWS Bedrock via SDK
// AI_PROVIDER=ollama   → local Ollama instance

import { z } from 'zod'

const ReasoningSchema = z.object({
  enabled: z.boolean(),
  budgetTokens: z.number(),
})

const ProviderConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('openai'),
    apiBase: z.string(),
    apiKey: z.string(),
    modelId: z.string(),
    reasoning: ReasoningSchema,
  }),
  z.object({
    type: z.literal('bedrock'),
    awsProfile: z.string(),
    awsRegion: z.string(),
    modelId: z.string(),
    reasoning: ReasoningSchema,
  }),
  z.object({
    type: z.literal('ollama'),
    host: z.string(),
    modelId: z.string(),
    reasoning: ReasoningSchema,
  }),
])

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

let _config: ProviderConfig | null = null

export function loadConfig(): ProviderConfig {
  if (_config) return _config

  const providerType = process.env.AI_PROVIDER ?? 'openai'
  const reasoning = {
    enabled: process.env.AI_REASONING_ENABLED === 'true',
    budgetTokens: parseInt(process.env.AI_REASONING_BUDGET ?? '1024', 10),
  }

  let raw: unknown
  if (providerType === 'bedrock') {
    raw = {
      type: 'bedrock',
      awsProfile: process.env.AWS_PROFILE ?? 'default',
      awsRegion: process.env.AWS_REGION ?? 'us-east-1',
      modelId: process.env.AWS_MODEL_ID ?? 'anthropic.claude-haiku-4-5',
      reasoning,
    }
  } else if (providerType === 'ollama') {
    raw = {
      type: 'ollama',
      host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
      modelId: process.env.OLLAMA_MODEL ?? 'llama3',
      reasoning,
    }
  } else {
    raw = {
      type: 'openai',
      apiBase: process.env.AI_API_BASE,
      apiKey: process.env.AI_API_KEY ?? '',
      modelId: process.env.AI_MODEL_ID ?? 'claude-4.6-sonnet',
      reasoning,
    }
  }

  const result = ProviderConfigSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid provider config: ${result.error.message}`)
  }

  _config = result.data
  return _config
}
