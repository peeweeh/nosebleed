// Bedrock provider adapter — single normalized call interface.
// Uses fromIni credential provider so AWS_PROFILE is resolved correctly.

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import { fromIni } from '@aws-sdk/credential-providers'
import { loadConfig } from '@/lib/config'

let _client: BedrockRuntimeClient | null = null

function getClient(): BedrockRuntimeClient {
  if (_client) return _client
  const cfg = loadConfig()
  _client = new BedrockRuntimeClient({
    region: cfg.provider.aws.region,
    credentials: fromIni({ profile: cfg.provider.aws.profile }),
  })
  return _client
}

export interface LLMRequest {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
}

export interface LLMResponse {
  text: string
  ok: boolean
}

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const cfg = loadConfig()
  const client = getClient()
  const modelId = cfg.provider.aws.modelId
  const isNova = modelId.startsWith('amazon.nova')

  // Nova and Claude have different request/response schemas
  const body = isNova
    ? {
        system: [{ text: req.systemPrompt }],
        messages: [{ role: 'user', content: [{ text: req.userMessage }] }],
        inferenceConfig: { maxTokens: req.maxTokens ?? 256 },
      }
    : {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: req.maxTokens ?? 256,
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userMessage }],
      }

  try {
    const cmd = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    })

    const res = await client.send(cmd)
    const decoded = JSON.parse(Buffer.from(res.body).toString('utf-8'))

    // Nova: output.message.content[0].text  |  Claude: content[0].text
    const text: string = isNova
      ? (decoded?.output?.message?.content?.[0]?.text ?? '')
      : (decoded?.content?.[0]?.text ?? '')

    return { text: text.trim(), ok: true }
  } catch (err) {
    console.error('[provider] LLM call failed:', err)
    return { text: '', ok: false }
  }
}
