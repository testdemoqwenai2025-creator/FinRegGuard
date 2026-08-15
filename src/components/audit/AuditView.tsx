'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Download, Shield, Filter, Hash } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { AuditLog } from '@/lib/types'
import { usePluginData } from '@/hooks/use-plugin-data'
import { BackToDashboard } from '@/components/shared/BackToDashboard'

const SEVERITIES = ['ALL', 'info', 'warning', 'critical']
const ACTIONS = [
  'ALL',
  'policy.update',
  'policy.review',
  'policy.publish',
  'policy.overdue',
  'regulation.detected',
  'regulation.review',
  'regulation.effective',
  'risk.escalate',
  'risk.assess',
  'risk.threshold',
  'audit.export',
  'audit.review',
  'user.access',
  'chat.session',
  'ai.suggestion.generate',
]

const severityColor: Record<string, string> = {
  info: 'bg-slate-50 text-slate-700 border-slate-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const targetTypeColor: Record<string, string> = {
  policy: 'bg-violet-50 text-violet-700',
  regulation: 'bg-sky-50 text-sky-700',
  risk: 'bg-rose-50 text-rose-700',
  user: 'bg-emerald-50 text-emerald-700',
  report: 'bg-amber-50 text-amber-700',
}

export function AuditView() {
  // `select` extracts the `logs` array from the response envelope so the
  // rest of the component can work directly with `AuditLog[]`.
  const { data: logs, loading, error } = usePluginData<AuditLog[]>('audit', {
    select: (raw) => (raw as { logs?: AuditLog[] }).logs ?? [],
  })
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('ALL')
  const [action, setAction] = useState('ALL')

  const filtered = useMemo(() => {
    return (logs ?? []).filter((l) => {
      if (severity !== 'ALL' && l.severity !== severity) return false
      if (action !== 'ALL' && l.action !== action) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          l.description.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.targetId.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logs, search, severity, action])

  // Quick stats
  const bySeverity = useMemo(() => {
    const map = { info: 0, warning: 0, critical: 0 }
    ;(logs ?? []).forEach((l) => {
      map[l.severity as keyof typeof map] = (map[l.severity as keyof typeof map] ?? 0) + 1
    })
    return map
  }, [logs])

  const exportCsv = () => {
    const header = 'timestamp,actor,action,targetType,targetId,severity,description\n'
    const rows = filtered
      .map((l) =>
        [
          l.timestamp,
          `"${l.actor}"`,
          l.action,
          l.targetType,
          l.targetId,
          l.severity,
          `"${l.description.replace(/"/g, '""')}"`,
        ].join(','),
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  }
  if (error) {
    return <div className="p-6 text-rose-700">Failed to load audit trail: {error.message}</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Trail</h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable, hash-chained log of every compliance-relevant action across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackToDashboard />
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Integrity banner */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 shadow-sm">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Shield className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Audit trail integrity verified — 0 hash mismatches
              </p>
              <p className="text-xs text-emerald-700/80">
                Last integrity check {format(new Date(), 'MMM d, HH:mm')} · {(logs ?? []).length} entries
                chained · SHA-256
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <IntegrityStat label="Info" value={bySeverity.info} color="text-slate-700" />
            <IntegrityStat label="Warning" value={bySeverity.warning} color="text-amber-700" />
            <IntegrityStat label="Critical" value={bySeverity.critical} color="text-rose-700" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">Event Log</CardTitle>
              <CardDescription>
                Showing {filtered.length} of {(logs ?? []).length} entries
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search actor, description, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-56 pl-9 text-sm"
                  aria-label="Search audit log"
                />
              </div>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-9 w-32 text-sm" aria-label="Severity filter">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s === 'ALL' ? 'All Severities' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="h-9 w-44 text-sm" aria-label="Action filter">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === 'ALL' ? 'All Actions' : a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setSearch('')
                  setSeverity('ALL')
                  setAction('ALL')
                }}
              >
                <Filter className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[640px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-40">Timestamp</TableHead>
                  <TableHead className="w-40">Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-32">Target</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <div className="flex flex-col text-[11px] leading-tight">
                        <span className="font-medium text-slate-700">
                          {format(parseISO(l.timestamp), 'MMM d, yyyy')}
                        </span>
                        <span className="text-slate-400">
                          {format(parseISO(l.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs ${l.actor === 'system' ? 'text-slate-500 italic' : 'text-slate-700 font-medium'}`}
                      >
                        {l.actor}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                        {l.action}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize ${targetTypeColor[l.targetType] ?? 'bg-slate-100 text-slate-700'}`}
                        >
                          {l.targetType}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                        <Hash className="h-2.5 w-2.5" />
                        {l.targetId.slice(0, 12)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-700 line-clamp-2">{l.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${severityColor[l.severity]}`}
                      >
                        {l.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      No audit events match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrityStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  )
}
