/**
 * LLM Service — thin wrapper around the z-ai-web-dev-sdk.
 *
 * Exposes a single `chat()` function with sensible defaults and retry logic.
 * Server-side only — the SDK must never be imported in client code.
 *
 * Swap target: when we add support for OpenAI / Anthropic / local Llama,
 * only this file changes. The RAG pipeline and API routes stay the same.
 */

import 'server-only'
import ZAI from 'z-ai-web-dev-sdk'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatOptions = {
  temperature?: number
  maxTokens?: number
  retries?: number
}

let zaiInstance: ZAI | null = null

async function getZai(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/**
 * Send a chat completion request with retry-on-failure.
 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const { temperature = 0.4, maxTokens = 700, retries = 2 } = opts

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const zai = await getZai()
      const completion = await zai.chat.completions.create({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        thinking: { type: 'disabled' },
        temperature,
        max_tokens: maxTokens,
      })

      const content = completion?.choices?.[0]?.message?.content
      if (!content || content.trim().length === 0) {
        throw new Error('LLM returned empty response')
      }
      return content
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        // Exponential backoff: 500ms, 1s, 2s...
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError ?? new Error('LLM call failed after retries')
}

/**
 * Generate a short title for a chat session based on the first user message.
 */
export async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const title = await chat(
      [
        {
          role: 'system',
          content:
            'Generate a concise 3-6 word title for a compliance chat session starting with this message. Reply with the title only — no quotes, no punctuation at the end.',
        },
        { role: 'user', content: firstMessage.slice(0, 200) },
      ],
      { temperature: 0.7, maxTokens: 30, retries: 0 },
    )
    return title.trim().slice(0, 60)
  } catch {
    // Fallback: derive from first few words
    return firstMessage.split(' ').slice(0, 6).join(' ').slice(0, 60)
  }
}
