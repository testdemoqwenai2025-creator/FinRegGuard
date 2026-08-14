import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ragQuery } from '@/lib/ai/rag'
import { generateTitle, type ChatMessage } from '@/lib/ai/llm'

const SYSTEM_PROMPT = `You are an AI Regulatory Compliance Assistant for a global RegTech platform serving banks, insurers, pharmaceutical companies, and hospitals. You help compliance officers:

1. Interpret regulatory changes across jurisdictions (US SEC/FINRA/HHS, EU ESMA/EBA/EMA, UK FCA, SG MAS, JP PMDA, AU APRA, CA OSFI).
2. Draft and revise internal policy language to comply with new rules.
3. Assess impact of regulations on specific business units (Retail Banking, Wealth Management, Capital Markets, Insurance, Pharma R&D, Hospital Ops, Technology, Operations, Risk).
4. Recommend mitigation actions and prioritise remediation work.
5. Explain concepts such as AML/CFT, MiFID II, Consumer Duty, Basel III, GDPR, HIPAA, GMP, AI Act, CPS 234.

Style guidelines:
- Be specific and cite the relevant regulation by name and article where possible.
- Use clear, structured answers (numbered lists, short paragraphs).
- When the user asks about impact, quantify effort in person-days where reasonable.
- Always recommend the next action the compliance officer should take.
- If you do not know, say so; do not fabricate regulatory citations.
- Keep responses under 300 words unless the user asks for depth.`

/**
 * GET /api/chat
 * Returns recent chat history (flat list, no sessions yet).
 */
export async function GET() {
  const messages = await db.chatMessage.findMany({
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  return NextResponse.json({ messages })
}

/**
 * POST /api/chat
 *
 * RAG-augmented chat endpoint. Flow:
 *   1. Persist the user's message
 *   2. Retrieve relevant chunks from the vector store
 *   3. Build augmented prompt (system + retrieved context + history + query)
 *   4. Call LLM via the ZAI SDK
 *   5. Persist the assistant reply
 *   6. Record in audit trail
 *   7. Return reply + source citations
 *
 * If the vector store is empty (no chunks indexed), falls back gracefully
 * to a non-RAG completion with the same system prompt.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as {
      message: string
      history?: Array<{ role: string; content: string }>
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Persist user message
    await db.chatMessage.create({
      data: { role: 'user', content: message },
    })

    // Build conversation history (last 8 turns)
    const conversationHistory: ChatMessage[] = (history ?? [])
      .slice(-8)
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

    // Run RAG pipeline
    const result = await ragQuery(message, conversationHistory, 5)

    // Persist assistant reply
    await db.chatMessage.create({
      data: { role: 'assistant', content: result.reply },
    })

    // Record in audit trail
    await db.auditLog.create({
      data: {
        actor: 'sarah.chen@regco.io',
        action: 'chat.rag.query',
        targetType: 'report',
        targetId: 'ai-assistant',
        description: `RAG query (${result.sources.length} sources retrieved, ${result.latencyMs}ms): ${message.slice(0, 80)}${message.length > 80 ? '...' : ''}`,
        severity: 'info',
      },
    })

    return NextResponse.json({
      reply: result.reply,
      sources: result.sources.map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        title: s.title,
        jurisdiction: s.jurisdiction,
        category: s.category,
        score: Number(s.score.toFixed(4)),
        snippet: s.content.slice(0, 180) + (s.content.length > 180 ? '...' : ''),
      })),
      latencyMs: result.latencyMs,
      systemPrompt: SYSTEM_PROMPT,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/chat] error:', message)
    return NextResponse.json(
      { error: 'AI assistant temporarily unavailable', detail: message },
      { status: 500 },
    )
  }
}
