'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  FileText,
  Gavel,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { ChatMessage } from '@/lib/types'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'
import { BackToDashboard } from '@/components/shared/BackToDashboard'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  sources?: SourceCitation[]
  latencyMs?: number
}

type SourceCitation = {
  id: string
  sourceType: string
  title: string
  jurisdiction: string | null
  category: string | null
  score: number
  snippet: string
}

const SUGGESTED = [
  {
    icon: Gavel,
    text: 'What is the impact of EU AI Act on our insurance underwriting models?',
    accent: 'text-fuchsia-600 bg-fuchsia-50',
  },
  {
    icon: FileText,
    text: 'Draft a policy update for the AML/CFT section on sanctions screening.',
    accent: 'text-violet-600 bg-violet-50',
  },
  {
    icon: AlertTriangle,
    text: 'Which risks have worsened this quarter and what is the recommended remediation?',
    accent: 'text-rose-600 bg-rose-50',
  },
  {
    icon: ShieldCheck,
    text: 'Summarise our HIPAA encryption posture vs the proposed HHS NPRM.',
    accent: 'text-emerald-600 bg-emerald-50',
  },
]

export function AssistantView() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(dataUrl('chat'))
      .then((r) => r.json())
      .then((d) => {
        const persisted: Msg[] = (d.messages ?? [])
          .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
          .map((m: ChatMessage) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt,
          }))
        setMessages(persisted)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, sending])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      if (IS_STATIC_BUILD) {
        // Static GitHub Pages build — no server-side LLM or vector store.
        // Provide a canned but contextual reply based on keyword matching.
        await new Promise((r) => setTimeout(r, 600))
        const aiMsg: Msg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: staticReply(trimmed),
        }
        setMessages((prev) => [...prev, aiMsg])
        return
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Request failed')
      const aiMsg: Msg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply ?? 'Sorry, I could not generate a response.',
        sources: data.sources ?? [],
        latencyMs: data.latencyMs,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const e = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ I couldn't reach the AI service just now (${e}). Please try again.`,
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    if (confirm('Clear the visible conversation? Persisted history remains in the audit trail.')) {
      setMessages([])
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Compliance Assistant
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ask about regulations, draft policy language, or assess impact on your business units.
            Powered by Z.ai LLM with regulatory context.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackToDashboard />
          <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chat column */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm flex flex-col h-[680px]">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">RegGuard Copilot</CardTitle>
                  <CardDescription className="text-[11px]">
                    Trained on your regulations &amp; policies
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4 space-y-4">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <Sparkles className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-800">
                    Ask me anything about your compliance posture
                  </h3>
                  <p className="mt-1 max-w-md text-xs text-slate-500">
                    I have context on the 12 regulations you track, your 6 active policies, and the
                    12 risk items across 8 business units.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              {sending && (
                <div className="flex items-start gap-2.5">
                  <Avatar role="assistant" />
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about regulations, request a policy draft, or assess risk..."
                className="min-h-[44px] max-h-32 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                aria-label="Message input"
              />
              <Button
                size="icon"
                className="h-11 w-11 shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                onClick={() => send(input)}
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">
              Press Enter to send · Shift+Enter for new line · Responses are logged to the audit trail.
            </p>
          </div>
        </Card>

        {/* Suggested prompts sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Suggested Prompts
              </CardTitle>
              <CardDescription className="text-[11px]">
                Tap to send a pre-built question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    disabled={sending}
                    className="group w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/30 disabled:opacity-50"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${s.accent}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[11px] leading-tight text-slate-700 group-hover:text-slate-900">
                        {s.text}
                      </p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="h-4 w-4" />
                Privacy &amp; Audit
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-800/80">
                Conversations are encrypted in transit and persisted to the immutable audit trail.
                The assistant cannot access customer PII or transaction-level data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
        SC
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
      <Bot className="h-4 w-4 text-white" />
    </div>
  )
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar role={msg.role} />
      <div className="flex flex-col gap-1.5 max-w-[78%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-slate-800 text-white'
              : 'rounded-tl-sm bg-slate-100 text-slate-800'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
          {msg.createdAt && (
            <p
              className={`mt-1 text-[10px] ${isUser ? 'text-slate-300' : 'text-slate-400'}`}
            >
              {format(parseISO(msg.createdAt), 'MMM d, HH:mm')}
              {msg.latencyMs ? ` · ${msg.latencyMs}ms` : ''}
            </p>
          )}
        </div>
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <SourceList sources={msg.sources} />
        )}
      </div>
    </div>
  )
}

function SourceList({ sources }: { sources: SourceCitation[] }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 px-3 py-2 text-[11px]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-emerald-800 hover:text-emerald-900"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="h-3 w-3" />
          {sources.length} source{sources.length === 1 ? '' : 's'} retrieved
        </span>
        <span className="text-[10px] text-emerald-600">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) => (
            <div
              key={s.id || i}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700 truncate">
                  <span className="text-emerald-600">[{i + 1}]</span>{' '}
                  {s.title}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  {(s.score * 100).toFixed(0)}%
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                {s.snippet}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                  {s.sourceType}
                </Badge>
                {s.jurisdiction && (
                  <span>· {s.jurisdiction}</span>
                )}
                {s.category && (
                  <span>· {s.category}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Canned reply generator for the static GitHub Pages build (no live LLM available).
 * Picks a relevant pre-written compliance answer based on keyword matching.
 */
function staticReply(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('ai act') || q.includes('eu ai')) {
    return `EU AI Act — key impact points for your insurance underwriting models:\n\n1. Annex III classifies insurance risk-pricing & creditworthiness assessment as HIGH-RISK (Art. 6(2)).\n2. You must complete a conformity assessment (Art. 43), register in the EU database (Art. 49), and appoint an authorised representative if established outside the EU.\n3. Transparency obligations under Art. 13: every automated decision ships with an Explainable Compliance Card (see the XCC module in this platform).\n4. Human oversight (Art. 14) — a qualified compliance officer must be able to override the model.\n5. Post-market monitoring (Art. 72) — track model drift and adverse incidents.\n\nRecommended next action: open the Rule Harmonizer, diff your existing AI Governance policy against the AI Act's Annex III requirements, and schedule a conformity assessment within 90 days.`
  }
  if (q.includes('aml') || q.includes('sanctions') || q.includes('cft')) {
    return `AML/CFT — policy draft skeleton for sanctions screening:\n\n1. Scope: all customer onboarding, transaction monitoring, and counterparty screening across SWIFT, SEPA, RTP and crypto channels.\n2. Lists covered: OFAC SDN, UN Consolidated, EU FSF, HMT OFSI, MAS, plus real-time additions via Refinitiv World-Check.\n3. Match scoring: exact (100), fuzzy (≥85 → review), partial (60-84 → escalate), phonetic (track separately).\n4. SLA: true-positive escalation within 2 hours, SAR filing within 24 hours, OFAC blocking immediately on confirmed match.\n5. Tuning governance: monthly false-positive review, quarterly threshold recalibration, annual independent assurance.\n\nNext action: route this draft through Policy Management → version 1.0 → Compliance review → Legal sign-off → Published.`
  }
  if (q.includes('risk') || q.includes('remediation') || q.includes('worsen')) {
    return `Risk trends this quarter — 3 items have worsened:\n\n1. Capital Markets — Market Integrity (SEC Rule 15c2-11): residual risk 18 ↑ from 12. Owner: James Okafor. Mitigation: complete impact assessment within 30 days.\n2. Retail Banking — AML Structuring: residual risk 16 ↑ from 11. Owner: Priya Nair. Mitigation: deploy enhanced transaction monitoring rules and retrain front-line staff.\n3. Wealth Management — Consumer Duty: residual risk 14 ↑ from 9. Owner: Marcus Webb. Mitigation: outcomes monitoring dashboard + quarterly Consumer Duty board report.\n\nPrioritise Capital Markets — it breaches the Board's risk appetite threshold of 15.`
  }
  if (q.includes('hipaa') || q.includes('encryption') || q.includes('hhs')) {
    return `HIPAA encryption posture vs HHS NPRM (proposed Feb 2027):\n\n• At-rest encryption: ✅ AES-256 across all ePHI datastores (EHR, PACS, claims).\n• In-transit: ✅ TLS 1.3 mandated; legacy TLS 1.2 deprecated Q3 2025.\n• MFA coverage: ⚠️ 87% of workforce — gap is non-clinical contractors.\n• Key management: ✅ AWS KMS with HSM-backed CMKs, 90-day rotation.\n• Gap: HHS NPRM §164.312(a)(2)(iv) requires MFA for ALL workforce — close contractor gap by end of Q4.\n\nNext action: open Case Management → create remediation case → assign to IAM team with 30-day SLA.`
  }
  return `That's a great compliance question. In this live static preview (hosted on GitHub Pages), I respond with canned illustrative answers — the full LLM-backed RegGuard Copilot is available when the application runs with its server (Next.js standalone) and the z-ai-web-dev-sdk connected.\n\nTry asking about: "EU AI Act", "AML sanctions policy", "worsening risks", or "HIPAA encryption" to see how the assistant would structure a cited, action-oriented compliance answer.`
}
