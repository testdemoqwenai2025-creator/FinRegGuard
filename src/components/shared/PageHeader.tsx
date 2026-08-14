'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHome } from '@/lib/home-context'

export function PageHeader({
  zone,
  title,
  subtitle,
  icon: Icon,
  accent = 'from-emerald-500 to-teal-600',
}: {
  zone: string
  title: string
  subtitle: string
  icon: LucideIcon
  accent?: string
}) {
  const goHome = useHome()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br', accent)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{zone}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* Back to Dashboard — auto-rendered on every view that uses PageHeader,
          except when we're already on the dashboard (goHome is null there). */}
      {goHome && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => goHome()}
          className="gap-1.5 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 self-start sm:self-auto"
          aria-label="Back to Dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-xs font-medium">Dashboard</span>
        </Button>
      )}
    </div>
  )
}

export function KpiTile({
  label,
  value,
  sub,
  icon: Icon,
  tint = 'text-slate-700 bg-slate-50',
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  tint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', tint)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

export function ZoneBadge({ zone, color = 'bg-slate-100 text-slate-700' }: { zone: string; color?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', color)}>
      {zone}
    </span>
  )
}
