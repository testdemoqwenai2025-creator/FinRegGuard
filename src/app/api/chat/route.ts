import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ragQuery } from '@/lib/ai/rag'
import { generateTitle, type ChatMessage } from '@/lib/ai/llm'
import { getEnabledPluginFilter } from '@/lib/plugins/rag-bridge'

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
- Keep responses under 300 words unless the user asks for depth.

CONTEXT SCOPE:
The user has enabled a set of regulatory plugins (forms, labels, features, document templates). The retrieved context is filtered to ONLY include chunks from:
- Internal regulations, policies, risk items, audit logs (always available)
- Plugin templates that the user has explicitly enabled

If a plugin is mentioned by name in the retrieved sources, it means the user has enabled it. If a relevant regulation is not in the context, it may be because the corresponding plugin is not enabled. In that case, mention that enabling the relevant plugin would provide more detailed guidance.`

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
 * Plugin-aware RAG chat endpoint. Flow:
 *   1. Persist the user's message
 *   2. Build RAG filter from currently-enabled plugins
 *      (always includes baseline: regulation, policy, risk, audit)
 *   3. Retrieve relevant chunks (filtered by enabled plugin scope)
 *   4. Build augmented prompt (system + retrieved context + history + query)
 *   5. Call LLM via the ZAI SDK
 *   6. Persist the assistant reply
 *   7. Record in audit trail (includes plugin filter metadata)
 *   8. Return reply + source citations (with plugin provenance)
 *
 * If no plugins are enabled, retrieval falls back to baseline internal sources.
 * If the vector store is empty, falls back to a non-RAG completion.
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

    // Build RAG filter from enabled plugins
    // (baseline source types always included; plugin jurisdictions/categories
    // narrow the search to the user's currently-enabled regulatory scope)
    const pluginFilter = await getEnabledPluginFilter()

    // Run RAG pipeline with plugin-aware filter
    const result = await ragQuery(message, conversationHistory, 5, pluginFilter)

    // Persist assistant reply
    await db.chatMessage.create({
      data: { role: 'assistant', content: result.reply },
    })

    // Record in audit trail — include the plugin filter so we can reconstruct
    // exactly which regulatory scope was active when this query was answered
    await db.auditLog.create({
      data: {
        actor: 'sarah.chen@regco.io',
        action: 'chat.rag.query',
        targetType: 'report',
        targetId: 'ai-assistant',
        description: `RAG query (${result.sources.length} sources, ${result.latencyMs}ms, filter: types=[${pluginFilter.sourceTypes.join(',')}] jurisdictions=[${pluginFilter.jurisdictions.join(',')}] categories=[${pluginFilter.categories.join(',')}]): ${message.slice(0, 80)}${message.length > 80 ? '...' : ''}`,
        severity: 'info',
      },
    })

    return NextResponse.json({
      reply: result.reply,
      sources: result.sources.map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        sourceId: s.sourceId,
        title: s.title,
        jurisdiction: s.jurisdiction,
        category: s.category,
        score: Number(s.score.toFixed(4)),
        snippet: s.content.slice(0, 180) + (s.content.length > 180 ? '...' : ''),
        // Surface plugin provenance — UI can render "[Plugin: SEC Form ADV]" badges
        isPlugin: s.sourceType === 'plugin',
        pluginSlug: s.sourceType === 'plugin' ? s.sourceId : null,
      })),
      latencyMs: result.latencyMs,
      systemPrompt: SYSTEM_PROMPT,
      // Surface the active filter so the UI can show "Retrieved from: 4 enabled plugins"
      ragFilter: pluginFilter,
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
