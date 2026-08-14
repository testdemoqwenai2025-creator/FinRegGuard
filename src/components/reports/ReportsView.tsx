'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Download, TrendingUp, Globe2, Building2, DollarSign } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { DashboardData, Regulation, RiskItem } from '@/lib/types'
import { dataUrl } from '@/lib/data'

const JURISDICTION_COLORS: Record<string, string> = {
  US: '#0ea5e9',
  EU: '#8b5cf6',
  UK: '#a855f7',
  JP: '#f43f5e',
  SG: '#10b981',
  AU: '#14b8a6',
  CA: '#f97316',
}

const CATEGORY_COLORS = ['#10b981', '#0d9488', '#0ea5e9', '#8b5cf6', '#f97316', '#f43f5e', '#eab308', '#64748b']

export function ReportsView() {
  const [metrics, setMetrics] = useState<DashboardData | null>(null)
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(dataUrl('metrics')).then((r) => r.json()),
      fetch(dataUrl('regulations')).then((r) => r.json()),
      fetch(dataUrl('risk')).then((r) => r.json()),
    ])
      .then(([m, reg, r]) => {
        setMetrics(m)
        setRegulations(reg.regulations ?? [])
        setRisks(r.risks ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !metrics) {
    return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  }

  // Data shapes
  const trendData = metrics.history.map((m) => ({
    month: format(parseISO(m.snapshotDate), 'MMM'),
    score: m.overallScore,
    findings: m.openFindings,
    overdue: m.overdueTasks,
    training: m.trainingComplete,
  }))

  const jurisdictionData = Object.entries(
    regulations.reduce<Record<string, number>>((acc, r) => {
      acc[r.jurisdiction] = (acc[r.jurisdiction] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const categoryData = Object.entries(
    regulations.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Risk by business unit (radar)
  const unitRisk = new Map<string, number>()
  risks.forEach((r) => {
    unitRisk.set(r.businessUnit, Math.max(unitRisk.get(r.businessUnit) ?? 0, r.residualRisk))
  })
  const radarData = Array.from(unitRisk.entries()).map(([unit, value]) => ({
    unit: unit.length > 12 ? unit.slice(0, 11) + '…' : unit,
    residual: value,
  }))

  // Fines/penalties avoided (illustrative)
  const finesAvoided = [
    { quarter: 'Q1', avoided: 2.4, incurred: 0.3 },
    { quarter: 'Q2', avoided: 3.1, incurred: 0.1 },
    { quarter: 'Q3', avoided: 4.7, incurred: 0.5 },
    { quarter: 'Q4', avoided: 5.2, incurred: 0.2 },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Compliance trends, jurisdiction breakdown, and ROI from automated monitoring.
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download className="h-4 w-4" />
          Export Quarterly Pack
        </Button>
      </div>

      {/* ROI / Top stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fines Avoided (YTD)"
          value="$15.4M"
          delta="+38% YoY"
          icon={DollarSign}
          tint="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Manual Hours Saved"
          value="12,840"
          delta="+22% QoQ"
          icon={TrendingUp}
          tint="text-violet-600 bg-violet-50"
        />
        <StatCard
          label="Jurisdictions Covered"
          value="8"
          delta="3 added in 2025"
          icon={Globe2}
          tint="text-sky-600 bg-sky-50"
        />
        <StatCard
          label="Business Units Monitored"
          value="8"
          delta="Full coverage"
          icon={Building2}
          tint="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Trend multi-line */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">6-Month Compliance Trend</CardTitle>
              <CardDescription>Score, open findings, overdue tasks, training completion</CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
              <TrendingUp className="mr-1 h-3 w-3" />
              All metrics improving
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
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
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Compliance Score" />
                <Line type="monotone" dataKey="training" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} name="Training %" />
                <Line type="monotone" dataKey="findings" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Open Findings" />
                <Line type="monotone" dataKey="overdue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Overdue Tasks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two-up: Jurisdiction pie + Category bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="h-4 w-4 text-emerald-600" />
              Regulations by Jurisdiction
            </CardTitle>
            <CardDescription>Distribution across monitored regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jurisdictionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {jurisdictionData.map((entry) => (
                      <Cell key={entry.name} fill={JURISDICTION_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Regulations by Category</CardTitle>
            <CardDescription>Top regulatory domains tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk radar + fines bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Residual Risk by Business Unit</CardTitle>
            <CardDescription>Maximum residual risk per unit (lower is better)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={90}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="unit" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 25]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar
                    name="Residual Risk"
                    dataKey="residual"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Fines Avoided vs Incurred (2025, $M)</CardTitle>
            <CardDescription>Quarterly ROI from automated compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finesAvoided} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `$${v}M`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avoided" name="Fines Avoided" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="incurred" name="Fines Incurred" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAM callout */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                Market Opportunity
              </div>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                RegTech TAM projected to reach $55B by 2027
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Banks, insurers, pharmaceutical companies, and hospitals face a 12-18% annual growth
                in regulatory burden. Once integrated, RegGuard AI customers see 94% retention —
                the platform becomes system-critical within 90 days of deployment.
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-bold text-emerald-700">94%</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Net Retention</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-700">7.2x</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Avg ROI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-700">90d</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Time-to-stickiness</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint,
}: {
  label: string
  value: string
  delta: string
  icon: React.ElementType
  tint: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-[11px] text-emerald-600">{delta}</p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
