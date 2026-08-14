'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Filter, Gavel, MapPin, Calendar, Building2, Sparkles } from 'lucide-react'
import { format, parseISO, formatDistanceToNow, isAfter } from 'date-fns'
import type { Regulation } from '@/lib/types'
import { dataUrl } from '@/lib/data'

const JURISDICTIONS = ['ALL', 'US', 'EU', 'UK', 'JP', 'SG', 'AU', 'CA']
const STATUSES = ['ALL', 'monitoring', 'pending', 'effective', 'superseded']
const IMPACTS = ['ALL', 'low', 'medium', 'high', 'critical']

const impactColor: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusColor: Record<string, string> = {
  monitoring: 'bg-sky-50 text-sky-700 border-sky-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  effective: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  superseded: 'bg-slate-100 text-slate-500 border-slate-200',
}

const jurisdictionColor: Record<string, string> = {
  US: 'bg-blue-50 text-blue-700 border-blue-200',
  EU: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  UK: 'bg-purple-50 text-purple-700 border-purple-200',
  JP: 'bg-rose-50 text-rose-700 border-rose-200',
  SG: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AU: 'bg-teal-50 text-teal-700 border-teal-200',
  CA: 'bg-orange-50 text-orange-700 border-orange-200',
}

export function RegulationsView() {
  const [items, setItems] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jurisdiction, setJurisdiction] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [impact, setImpact] = useState('ALL')
  const [selected, setSelected] = useState<Regulation | null>(null)

  useEffect(() => {
    fetch(dataUrl('regulations'))
      .then((r) => r.json())
      .then((d) => setItems(d.regulations ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (jurisdiction !== 'ALL' && r.jurisdiction !== jurisdiction) return false
      if (status !== 'ALL' && r.status !== status) return false
      if (impact !== 'ALL' && r.impactLevel !== impact) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.regulator.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [items, search, jurisdiction, status, impact])

  // Quick stats
  const byJurisdiction = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((r) => map.set(r.jurisdiction, (map.get(r.jurisdiction) ?? 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [items])

  const upcoming = useMemo(
    () =>
      items
        .filter((r) => isAfter(parseISO(r.effectiveDate), new Date()))
        .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime()),
    [items],
  )

  if (loading) {
    return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Regulation Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} regulations monitored across {byJurisdiction.length} jurisdictions —
          automatically ingested from regulator publications and tagged by AI.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byJurisdiction.slice(0, 4).map(([juris, count]) => (
          <Card key={juris} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">{juris}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </div>
              <Badge variant="outline" className={`${jurisdictionColor[juris] ?? ''} text-xs`}>
                <MapPin className="mr-1 h-3 w-3" />
                {juris}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming effective dates */}
      {upcoming.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-amber-600" />
              Upcoming Effective Dates
            </CardTitle>
            <CardDescription>Regulations becoming enforceable within the next 90 days</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {upcoming.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs hover:bg-amber-50 transition-colors"
              >
                <Badge variant="outline" className={`text-[10px] ${jurisdictionColor[r.jurisdiction] ?? ''}`}>
                  {r.jurisdiction}
                </Badge>
                <span className="font-medium text-slate-700">{r.title.slice(0, 38)}{r.title.length > 38 ? '…' : ''}</span>
                <span className="text-amber-700">·</span>
                <span className="text-amber-700">{format(parseISO(r.effectiveDate), 'MMM d, yyyy')}</span>
                <span className="text-slate-400">({formatDistanceToNow(parseISO(r.effectiveDate), { addSuffix: true })})</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters + Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">All Regulations</CardTitle>
              <CardDescription>
                {filtered.length} of {items.length} shown
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-48 pl-9 text-sm"
                  aria-label="Search regulations"
                />
              </div>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger className="h-9 w-32 text-sm" aria-label="Jurisdiction filter">
                  <SelectValue placeholder="Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j === 'ALL' ? 'All Jurisdictions' : j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-32 text-sm" aria-label="Status filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s === 'ALL' ? 'All Statuses' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="h-9 w-32 text-sm" aria-label="Impact filter">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACTS.map((i) => (
                    <SelectItem key={i} value={i} className="capitalize">
                      {i === 'ALL' ? 'All Impacts' : i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-[40%]">Regulation</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Effective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer hover:bg-emerald-50/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {r.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Gavel className="h-3 w-3" />
                            {r.regulator}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {r.affectedUnits.split(',')[0]}
                            {r.affectedUnits.split(',').length > 1 && ` +${r.affectedUnits.split(',').length - 1}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${jurisdictionColor[r.jurisdiction] ?? ''}`}>
                        {r.jurisdiction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600">{r.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] capitalize ${statusColor[r.status]}`}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] capitalize ${impactColor[r.impactLevel]}`}>
                        {r.impactLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600">
                        {format(parseISO(r.effectiveDate), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
                      No regulations match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-[11px] ${jurisdictionColor[selected.jurisdiction] ?? ''}`}>
                    {selected.jurisdiction}
                  </Badge>
                  <Badge variant="outline" className={`text-[11px] capitalize ${statusColor[selected.status]}`}>
                    {selected.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[11px] capitalize ${impactColor[selected.impactLevel]}`}>
                    {selected.impactLevel} impact
                  </Badge>
                </div>
                <DialogTitle className="text-xl pr-8">{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.regulator} · {selected.category} · effective{' '}
                  {format(parseISO(selected.effectiveDate), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Summary
                  </h4>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">{selected.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Affected Business Units
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.affectedUnits.split(',').map((u) => (
                      <Badge key={u} variant="secondary" className="text-xs">
                        {u.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <Sparkles className="h-4 w-4" />
                    AI Recommended Actions
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-emerald-800/90">
                    <li>• Assign impact-assessment owner across all affected business units</li>
                    <li>• Identify policies requiring version update within 30 days</li>
                    <li>• Schedule compliance training refresh for affected workforce</li>
                    <li>• Add to next Risk Committee agenda with residual-risk projection</li>
                  </ul>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm">Dismiss</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Create Remediation Task
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
