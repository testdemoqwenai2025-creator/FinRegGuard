'use client'

import { Fragment, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { RiskItem, RiskUnitSummary } from '@/lib/types'
import { usePluginData } from '@/hooks/use-plugin-data'
import { BackToDashboard } from '@/components/shared/BackToDashboard'

// 5x5 risk matrix: likelihood (rows) x impact (cols)
// Cell color intensity based on inherent risk score (likelihood * impact)
function cellColor(score: number): string {
  if (score >= 20) return 'bg-rose-500 text-white'
  if (score >= 15) return 'bg-orange-400 text-white'
  if (score >= 10) return 'bg-amber-300 text-amber-900'
  if (score >= 6) return 'bg-lime-200 text-lime-900'
  return 'bg-emerald-200 text-emerald-900'
}

const trendIcon = {
  improving: <TrendingUp className="h-3 w-3 text-emerald-600" />,
  stable: <Minus className="h-3 w-3 text-slate-500" />,
  worsening: <TrendingDown className="h-3 w-3 text-rose-600" />,
}

type RiskPayload = { risks: RiskItem[]; unitSummary: RiskUnitSummary[] }

export function RiskView() {
  // Single fetch; `select` splits the payload into the two arrays the
  // component needs so we avoid two `useState` calls and a manual split.
  const { data, loading, error } = usePluginData<{ risks: RiskItem[]; unitSummary: RiskUnitSummary[] }>('risk', {
    select: (raw) => {
      const r = raw as Partial<RiskPayload>
      return { risks: r.risks ?? [], unitSummary: r.unitSummary ?? [] }
    },
  })
  const risks = data?.risks ?? []
  const summary = data?.unitSummary ?? []

  if (loading) {
    return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  }
  if (error) {
    return <div className="p-6 text-rose-700">Failed to load risk register: {error.message}</div>
  }

  // Build 5x5 matrix indexed [likelihood-1][impact-1]
  const matrix: RiskItem[][][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => []),
  )
  risks.forEach((r) => {
    const i = Math.min(Math.max(r.likelihood - 1, 0), 4)
    const j = Math.min(Math.max(r.impact - 1, 0), 4)
    matrix[i][j].push(r)
  })

  const criticalCount = risks.filter((r) => r.residualRisk >= 12).length
  const improvingCount = risks.filter((r) => r.trend === 'improving').length
  const worseningCount = risks.filter((r) => r.trend === 'worsening').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Risk Assessment Matrix</h1>
          <p className="mt-1 text-sm text-slate-500">
            {risks.length} risks scored across {summary.length} business units. Likelihood × Impact =
            inherent risk; residual risk reflects control effectiveness.
          </p>
        </div>
        <BackToDashboard />
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Risks"
          value={risks.length}
          icon={AlertTriangle}
          tint="text-violet-600 bg-violet-50"
        />
        <StatTile
          label="Critical (Residual ≥ 12)"
          value={criticalCount}
          icon={ShieldAlert}
          tint="text-rose-600 bg-rose-50"
        />
        <StatTile
          label="Improving"
          value={improvingCount}
          icon={TrendingUp}
          tint="text-emerald-600 bg-emerald-50"
        />
        <StatTile
          label="Worsening"
          value={worseningCount}
          icon={TrendingDown}
          tint="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 5x5 Matrix */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Inherent Risk Heatmap</CardTitle>
            <CardDescription>Likelihood (rows) × Impact (columns)</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={150}>
              <div className="flex gap-2">
                {/* Y-axis label */}
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <span className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 [writing-mode:vertical-rl] rotate-180">
                      Likelihood →
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  {/* X-axis label */}
                  <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Impact →
                  </div>
                  <div className="grid grid-cols-[28px_repeat(5,1fr)] gap-1">
                    {/* Top-left empty corner */}
                    <div />
                    {['1', '2', '3', '4', '5'].map((c) => (
                      <div key={c} className="text-center text-[11px] font-medium text-slate-500">
                        {c}
                      </div>
                    ))}
                    {/* Rows */}
                    {[5, 4, 3, 2, 1].map((likelihood) => (
                      <Fragment key={`row-${likelihood}`}>
                        <div
                          className="flex items-center justify-center text-[11px] font-medium text-slate-500"
                        >
                          {likelihood}
                        </div>
                        {[1, 2, 3, 4, 5].map((impact) => {
                          const cell = matrix[likelihood - 1][impact - 1]
                          const score = likelihood * impact
                          return (
                            <Tooltip key={`${likelihood}-${impact}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`group relative flex aspect-square min-h-[60px] cursor-pointer flex-col items-center justify-center rounded-md ${cellColor(score)} transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-400`}
                                >
                                  {cell.length > 0 ? (
                                    <>
                                      <span className="text-lg font-bold leading-none">
                                        {cell.length}
                                      </span>
                                      <span className="text-[9px] uppercase opacity-80">
                                        {cell.length === 1 ? 'risk' : 'risks'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-medium opacity-40">{score}</span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-xs border-slate-200 bg-white p-2 text-slate-700 shadow-md"
                              >
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold">
                                    Likelihood {likelihood} · Impact {impact} · Score {score}
                                  </div>
                                  {cell.length === 0 ? (
                                    <div className="text-slate-400">No risks in this band.</div>
                                  ) : (
                                    cell.map((r) => (
                                      <div key={r.id} className="border-t border-slate-100 pt-1">
                                        <div className="font-medium">{r.businessUnit}</div>
                                        <div className="text-[11px] text-slate-500">
                                          {r.regulationArea} · residual {r.residualRisk}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </Fragment>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-[10px] text-slate-500">
                    <LegendItem color="bg-emerald-200" label="Low (≤5)" />
                    <LegendItem color="bg-lime-200" label="Moderate (6-9)" />
                    <LegendItem color="bg-amber-300" label="High (10-14)" />
                    <LegendItem color="bg-orange-400" label="Very High (15-19)" />
                    <LegendItem color="bg-rose-500" label="Extreme (≥20)" />
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Unit Summary */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-emerald-600" />
              Risk by Business Unit
            </CardTitle>
            <CardDescription>Average residual risk after controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary
              .sort((a, b) => b.avgResidual - a.avgResidual)
              .map((s) => {
                const pct = Math.min((s.avgResidual / 25) * 100, 100)
                const barColor =
                  s.avgResidual >= 12
                    ? 'bg-rose-500'
                    : s.avgResidual >= 8
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                return (
                  <div key={s.unit}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{s.unit}</span>
                      <span className="text-slate-500">
                        avg <strong className="text-slate-900">{s.avgResidual}</strong> · {s.count}{' '}
                        risks
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Risk Register</CardTitle>
          <CardDescription>Sorted by residual risk (highest first)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[480px]">
            <div className="divide-y divide-slate-100">
              {risks.map((r) => (
                <div key={r.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-800">{r.businessUnit}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {r.regulationArea}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                          {trendIcon[r.trend]}
                          {r.trend}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{r.mitigationPlan}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Owner: {r.owner}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <RiskScore label="Inherent" value={r.inherentRisk} />
                      <RiskScore label="Residual" value={r.residualRisk} highlight />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string
  value: number
  icon: React.ElementType
  tint: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function RiskScore({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const color =
    value >= 15
      ? 'text-rose-600'
      : value >= 12
        ? 'text-orange-600'
        : value >= 8
          ? 'text-amber-600'
          : 'text-emerald-600'
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${highlight ? color : 'text-slate-700'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  )
}
