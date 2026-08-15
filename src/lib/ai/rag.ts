/**
 * RAG Pipeline — Retrieval-Augmented Generation orchestrator.
 *
 * Flow:
 *   1. Take user query
 *   2. Retrieve top-K relevant chunks from the vector store
 *   3. Build a context block from the retrieved chunks
 *   4. Construct the augmented prompt (system + retrieved context + conversation + query)
 *   5. Call LLM
 *   6. Return assistant reply + source citations
 *
 * This module is the single integration point between the vector store
 * and the LLM. Swap providers independently:
 *   - Vector store: see vector-store.ts (TF-IDF today, pgvector/Qdrant later)
 *   - LLM: see llm.ts (ZAI today, OpenAI/Anthropic/local later)
 */

import { retrieve, type ScoredChunk } from './vector-store'
import { chat, type ChatMessage } from './llm'

export type RagResult = {
  reply: string
  sources: ScoredChunk[]
  latencyMs: number
}

const RAG_SYSTEM_PROMPT = `You are an AI Regulatory Compliance Assistant for a global RegTech platform serving banks, insurers, pharmaceutical companies, and hospitals.

You will be given CONTEXT — excerpts from the company's regulation tracker, policy library, and risk register. Use this context to ground your answer. Cite sources inline using [Source N] notation matching the numbered context entries.

Style guidelines:
- Be specific and cite the relevant regulation by name and article where possible.
- Use clear, structured answers (numbered lists, short paragraphs).
- When the user asks about impact, quantify effort in person-days where reasonable.
- Always recommend the next action the compliance officer should take.
- If the retrieved context does not contain enough information to answer confidently, say so explicitly and suggest what additional context would help.
- Do NOT fabricate regulatory citations. If you are unsure whether a citation is real, omit it.
- Keep responses under 300 words unless the user asks for depth.

When you reference a retrieved source, use the format [Source N] where N matches the numbered CONTEXT entry. List all cited sources at the end of your reply under a "Sources:" heading.`

/**
 * Build the augmented prompt with retrieved context.
 */
function buildContextBlock(sources: ScoredChunk[]): string {
  if (sources.length === 0) {
    return 'No relevant context was retrieved from the knowledge base. Answer from general regulatory knowledge but flag the absence of internal context.'
  }

  const lines = sources.map((s, i) => {
    const parts = [`[Source ${i + 1}]`]
    if (s.sourceType) parts.push(`(${s.sourceType})`)
    parts.push(s.title)
    if (s.jurisdiction) parts.push(`[${s.jurisdiction}]`)
    if (s.category) parts.push(`{${s.category}}`)
    parts.push('\n' + s.content)
    return parts.join(' ')
  })

  return 'CONTEXT — retrieved from internal knowledge base:\n\n' + lines.join('\n\n---\n\n')
}

/**
 * Run the full RAG pipeline for a user query.
 *
 * @param query       The user's question
 * @param history     Prior conversation turns (most recent last)
 * @param topK        Number of chunks to retrieve (default 5)
 * @param filter      Optional filter on source type / jurisdiction / category
 */
export async function ragQuery(
  query: string,
  history: ChatMessage[] = [],
  topK: number = 5,
  filter?: {
    sourceTypes?: string[]
    jurisdictions?: string[]
    categories?: string[]
  },
): Promise<RagResult> {
  const start = Date.now()

  // 1. Retrieve relevant chunks
  const sources = await retrieve(query, topK, filter)

  // 2. Build context block
  const contextBlock = buildContextBlock(sources)

  // 3. Construct messages: system + context + history + query
  const messages: ChatMessage[] = [
    { role: 'system', content: RAG_SYSTEM_PROMPT },
    { role: 'system', content: contextBlock },
    ...history.slice(-8),  // keep last 8 turns for token budget
    { role: 'user', content: query },
  ]

  // 4. Call LLM
  const reply = await chat(messages, {
    temperature: 0.3,
    maxTokens: 800,
  })

  return {
    reply,
    sources,
    latencyMs: Date.now() - start,
  }
}
