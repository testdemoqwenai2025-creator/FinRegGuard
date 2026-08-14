import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

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
- Keep responses under 250 words unless the user asks for depth.`

export async function GET() {
  // Return persisted chat history
  const messages = await db.chatMessage.findMany({
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  return NextResponse.json({ messages })
}

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

    // Build conversation context
    const conversationHistory = (history ?? []).slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
      temperature: 0.4,
      max_tokens: 700,
    })

    const reply =
      completion?.choices?.[0]?.message?.content ??
      'I apologise — I could not generate a response at this time. Please retry.'

    // Persist assistant reply
    await db.chatMessage.create({
      data: { role: 'assistant', content: reply },
    })

    // Record in audit trail
    await db.auditLog.create({
      data: {
        actor: 'sarah.chen@regco.io',
        action: 'chat.session',
        targetType: 'report',
        targetId: 'ai-assistant',
        description: `AI Compliance Assistant consulted — question: ${message.slice(0, 80)}${message.length > 80 ? '...' : ''}`,
        severity: 'info',
      },
    })

    return NextResponse.json({ reply })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/chat] error:', message)
    return NextResponse.json(
      { error: 'AI assistant temporarily unavailable', detail: message },
      { status: 500 },
    )
  }
}
