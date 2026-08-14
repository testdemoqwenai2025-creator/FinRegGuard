'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  LineChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Gavel,
  FileCheck2,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  Calendar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { DashboardData, AuditLog } from '@/lib/types'

const fmtMonth = (s: string) => {
  try {
    return format(parseISO(s), 'MMM')
  } catch {
    return s
  }
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/metrics').then((r) => r.json()),
      fetch('/api/audit?limit=8').then((r) => r.json()),
    ])
      .then(([d, l]) => {
        setData(d)
        setLogs(l.logs ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  const score = data.latest?.overallScore ?? 0
  const prevScore = data.previous?.overallScore ?? 0
  const delta = score - prevScore
  const chartData = data.history.map((m) => ({
    month: fmtMonth(m.snapshotDate),
    score: m.overallScore,
    findings: m.openFindings,
    training: m.trainingComplete,
  }))

  const kpiTiles = [
    {
      label: 'Tracked Regulations',
      value: data.counts.regulations,
      sub: `${data.kpis.pendingRegulations} pending effective`,
      icon: Gavel,
      tint: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Active Policies',
      value: data.counts.policies,
      sub: `${data.kpis.overduePolicies} overdue for review`,
      icon: FileCheck2,
      tint: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Critical Risks',
      value: data.kpis.criticalRisks,
      sub: 'Residual ≥ 12',
      icon: AlertTriangle,
      tint: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Audit Events',
      value: data.counts.auditLogs,
      sub: 'Last 30 days',
      icon: ClipboardList,
      tint: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Compliance Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live snapshot across <strong>8 jurisdictions</strong> — US, EU, UK, JP, SG, AU, CA, plus
            global harmonisation frameworks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Sparkles className="h-4 w-4" />
            Run AI Audit
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiTiles.map((t) => {
          const Icon = t.icon
          return (
            <Card key={t.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {t.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{t.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.sub}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.tint}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Score + Trends */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Overall Compliance Score
            </CardTitle>
            <CardDescription>Weighted across regulations, policies, and risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 264} 264`}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-slate-900">{score}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                {delta >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                )}
                <span className={delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {delta >= 0 ? '+' : ''}
                  {delta} pts
                </span>
                <span className="text-slate-500">vs last month</span>
              </div>
              <div className="mt-2 w-full space-y-2">
                <ScoreBar label="Policies Current" value={data.latest?.policiesCurrent ?? 0} color="bg-emerald-500" />
                <ScoreBar label="Training Complete" value={data.latest?.trainingComplete ?? 0} color="bg-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Compliance Trend (6 months)</CardTitle>
                <CardDescription>Score and open findings trajectory</CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                <TrendingUp className="mr-1 h-3 w-3" />
                Improving
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="findingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#scoreFill)"
                    name="Compliance Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="findings"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#findingsFill)"
                    name="Open Findings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts feed + open items */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Priority Alerts</CardTitle>
                <CardDescription>Items requiring action this week</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-slate-100 px-6">
                <AlertRow
                  severity="critical"
                  title="SEC Rule 15c2-11 — effective in 38 days"
                  desc="Capital Markets policy & procedures refresh not yet started. Impact: critical."
                  meta="US · SEC · Market Integrity"
                />
                <AlertRow
                  severity="critical"
                  title="Basel III Credit Risk gap exceeds tolerance"
                  desc="Standardised approach implementation flagged to Group Risk Committee. Remediation plan due in 60 days."
                  meta="EU · EBA · Basel III"
                />
                <AlertRow
                  severity="warning"
                  title="HIPAA Security Policy overdue by 5 days"
                  desc="Pre-empt HHS NPRM by mandating NIST encryption and MFA. Owner: IT Security."
                  meta="US · HHS-OCR · Data Privacy"
                />
                <AlertRow
                  severity="warning"
                  title="Hospital Ops — Data Privacy residual risk worsening"
                  desc="MFA rollout to clinical workstations delayed by integration issues. Mitigation plan needs revision."
                  meta="Hospital Ops · HIPAA"
                />
                <AlertRow
                  severity="info"
                  title="Consumer Duty policy in review"
                  desc="Forward-looking fair-value testing section drafted by AI. Risk Committee sign-off pending."
                  meta="UK · FCA · Conduct"
                />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Immutable audit trail (last 8 events)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-80">
              <ol className="relative px-6 py-2">
                {logs.map((log) => (
                  <li key={log.id} className="relative flex gap-3 pb-4 pl-5 last:pb-0">
                    <span
                      className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        log.severity === 'critical'
                          ? 'bg-rose-500'
                          : log.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                    />
                    <span className="absolute left-[4px] top-4 bottom-0 w-px bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 line-clamp-2">
                        {log.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {log.actor} · {format(parseISO(log.timestamp), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Training progress mini-row */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Key Programs Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProgramRow label="AML Training (Annual)" value={92} target={95} />
          <ProgramRow label="Consumer Duty CPD" value={78} target={85} />
          <ProgramRow label="AI Governance Briefing" value={64} target={90} />
          <ProgramRow label="HIPAA Workforce Module" value={88} target={100} />
        </CardContent>
      </Card>
    </div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function ProgramRow({ label, value, target }: { label: string; value: number; target: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-xs font-semibold text-slate-900">{value}%</span>
      </div>
      <Progress value={value} className="mt-2 h-2 bg-slate-100" />
      <p className="mt-1 text-[10px] text-slate-400">Target {target}%</p>
    </div>
  )
}

function AlertRow({
  severity,
  title,
  desc,
  meta,
}: {
  severity: 'critical' | 'warning' | 'info'
  title: string
  desc: string
  meta: string
}) {
  const colors = {
    critical: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    warning: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    info: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }[severity]

  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${colors.bar}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <Badge variant="outline" className={`text-[10px] capitalize ${colors.badge}`}>
            {severity}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{meta}</p>
      </div>
    </div>
  )
}
