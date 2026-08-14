'use client'

/**
 * BackToDashboard — a small "← Dashboard" outline button that calls the
 * HomeContext's goHome callback. Renders nothing when on the dashboard
 * itself (because goHome is null there).
 *
 * Use this in views that don't use <PageHeader /> (e.g. RegulationsView,
 * PoliciesView, AuditView, RiskView, AssistantView, ReportsView).
 * Views that DO use <PageHeader /> get the button automatically.
 */

import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHome } from '@/lib/home-context'

export function BackToDashboard({
  className = '',
  withLabel = true,
}: {
  className?: string
  withLabel?: boolean
}) {
  const goHome = useHome()
  if (!goHome) return null
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => goHome()}
      className={`gap-1.5 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${className}`}
      aria-label="Back to Dashboard"
    >
      <LayoutDashboard className="h-4 w-4" />
      {withLabel && <span className="text-xs font-medium">Dashboard</span>}
    </Button>
  )
}
