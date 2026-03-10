// Provider adapter — dispatches to bedrock, openai-compatible, or ollama.
// Configure via AI_PROVIDER in .env.local

import { loadConfig, type ProviderConfig } from '@/lib/config'
import fs from 'fs'
import path from 'path'

const TOKEN_LOG = path.join(process.cwd(), 'tokens.md')

function logTokens(modelId: string, inputTokens: number, outputTokens: number) {
  const line = `| ${modelId} | ${inputTokens} | ${outputTokens} |\n`
  if (!fs.existsSync(TOKEN_LOG)) {
    fs.writeFileSync(TOKEN_LOG, '| model | input tokens | output tokens |\n|---|---|---|\n')
  }
  fs.appendFileSync(TOKEN_LOG, line)
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

// ── OpenAI-compatible (custom endpoint or Ollama) ────────────────────────────

async function callOpenAI(
  apiBase: string,
  apiKey: string,
  cfg: ProviderConfig,
  req: LLMRequest,
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: cfg.modelId,
    max_tokens: req.maxTokens ?? 256,
    messages: [
      { role: 'system', content: req.systemPrompt },
      { role: 'user', content: req.userMessage },
    ],
  }
  if (cfg.reasoning.enabled) {
    body['thinking'] = { type: 'enabled', budget_tokens: cfg.reasoning.budgetTokens }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[provider] HTTP error', res.status, await res.text())
    return { text: '', ok: false }
  }

  const decoded = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const text = decoded?.choices?.[0]?.message?.content ?? ''
  logTokens(cfg.modelId, decoded?.usage?.prompt_tokens ?? 0, decoded?.usage?.completion_tokens ?? 0)
  return { text: text.trim(), ok: true }
}

// ── Bedrock ──────────────────────────────────────────────────────────────────

async function callBedrock(cfg: Extract<ProviderConfig, { type: 'bedrock' }>, req: LLMRequest): Promise<LLMResponse> {
  const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime')
  const { fromIni } = await import('@aws-sdk/credential-providers')

  const client = new BedrockRuntimeClient({
    region: cfg.awsRegion,
    credentials: fromIni({ profile: cfg.awsProfile }),
  })

  const isNova = cfg.modelId.startsWith('amazon.nova')
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
        ...(cfg.reasoning.enabled ? { thinking: { type: 'enabled', budget_tokens: cfg.reasoning.budgetTokens } } : {}),
      }

  const cmd = new InvokeModelCommand({
    modelId: cfg.modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(body),
  })

  const res = await client.send(cmd)
  const decoded = JSON.parse(Buffer.from(res.body).toString('utf-8'))
  const text: string = isNova
    ? (decoded?.output?.message?.content?.[0]?.text ?? '')
    : (decoded?.content?.[0]?.text ?? '')

  const inputTokens: number = decoded?.usage?.inputTokens ?? decoded?.usage?.input_tokens ?? 0
  const outputTokens: number = decoded?.usage?.outputTokens ?? decoded?.usage?.output_tokens ?? 0
  logTokens(cfg.modelId, inputTokens, outputTokens)
  return { text: text.trim(), ok: true }
}

// ── Main dispatch ────────────────────────────────────────────────────────────

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const cfg = loadConfig()

  try {
    if (cfg.type === 'bedrock') {
      return await callBedrock(cfg, req)
    }
    if (cfg.type === 'ollama') {
      return await callOpenAI(cfg.host, '', cfg, req)
    }
    // openai
    return await callOpenAI(cfg.apiBase, cfg.apiKey, cfg, req)
  } catch (err) {
    console.error('[provider] LLM call failed:', err)
    return { text: '', ok: false }
  }
}
