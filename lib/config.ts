// Config loader — reads from environment variables.
// Set these in .env.local (gitignored). See .env.local.example for reference.
// Previously loaded keys.json — migrated to env vars for Next.js compatibility.

import { z } from 'zod'

const ProviderConfigSchema = z.object({
  provider: z.object({
    aws: z.object({
      profile: z.string().default('eonar_dev003'),
      region: z.string().default('us-east-1'),
      modelId: z.string().default('anthropic.claude-haiku-4-5'),
    }),
  }),
})

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

let _config: ProviderConfig | null = null

export function loadConfig(): ProviderConfig {
  if (_config) return _config

  const result = ProviderConfigSchema.safeParse({
    provider: {
      aws: {
        profile: process.env.AWS_PROFILE ?? 'eonar_dev003',
        region: process.env.AWS_REGION ?? 'us-east-1',
        modelId: process.env.AWS_MODEL_ID ?? 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
      },
    },
  })

  if (!result.success) {
    throw new Error(`Invalid provider config: ${result.error.message}`)
  }

  _config = result.data
  return _config
}
