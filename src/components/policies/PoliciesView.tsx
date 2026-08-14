'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Sparkles,
  Clock,
  User,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { format, parseISO, isBefore, formatDistanceToNow } from 'date-fns'
import type { Policy } from '@/lib/types'
import { dataUrl } from '@/lib/data'

const statusColor: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-sky-50 text-sky-700 border-sky-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  retired: 'bg-rose-50 text-rose-700 border-rose-200',
}

const categoryColor: Record<string, string> = {
  AML: 'bg-violet-50 text-violet-700 border-violet-200',
  Conduct: 'bg-purple-50 text-purple-700 border-purple-200',
  'AI Governance': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'Data Privacy': 'bg-blue-50 text-blue-700 border-blue-200',
  'Clinical Trials': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cybersecurity: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function PoliciesView() {
  const [items, setItems] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [selected, setSelected] = useState<Policy | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  useEffect(() => {
    fetch(dataUrl('policies'))
      .then((r) => r.json())
      .then((d) => setItems(d.policies ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
    return true
  })

  const categories = ['ALL', ...Array.from(new Set(items.map((p) => p.category)))]
  const statuses = ['ALL', 'draft', 'review', 'approved', 'published', 'retired']

  const handleRegenerate = async (p: Policy) => {
    setRegenerating(p.id)
    // Simulate AI regeneration: in production this would call /api/chat with policy context
    setTimeout(() => {
      const updated = items.map((item) =>
        item.id === p.id
          ? {
              ...item,
              aiSuggestion: `${item.aiSuggestion ?? ''}\n\n[Refreshed just now] Reflecting the latest regulatory developments, additional controls may be required in the validation workflow section.`,
              lastUpdated: new Date().toISOString(),
            }
          : item,
      )
      setItems(updated)
      setRegenerating(null)
    }, 1200)
  }

  if (loading) {
    return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Policy Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} active policies with AI-assisted version control and auto-update
            suggestions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-sm" aria-label="Status filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === 'ALL' ? 'All Statuses' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-40 text-sm" aria-label="Category filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const overdue = isBefore(parseISO(p.reviewDate), new Date())
          const soon =
            !overdue &&
            parseISO(p.reviewDate).getTime() - new Date().getTime() < 21 * 24 * 60 * 60 * 1000
          return (
            <Card
              key={p.id}
              className="group border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-emerald-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] w-fit ${categoryColor[p.category] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      {p.category}
                    </Badge>
                    <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${statusColor[p.status]}`}>
                    {p.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <History className="h-3 w-3" />
                    v{p.version}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {p.ownerUnit}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-600 line-clamp-2">{p.content}</p>

                {p.aiSuggestion && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Update Suggestion
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90 line-clamp-3">
                      {p.aiSuggestion}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className={`h-3 w-3 ${overdue ? 'text-rose-500' : soon ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span
                      className={
                        overdue
                          ? 'text-rose-600 font-medium'
                          : soon
                            ? 'text-amber-600 font-medium'
                            : 'text-slate-500'
                      }
                    >
                      {overdue ? 'Overdue · ' : 'Review in '}
                      {formatDistanceToNow(parseISO(p.reviewDate), { addSuffix: !overdue })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                    onClick={() => setSelected(p)}
                  >
                    Open
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-[11px] ${categoryColor[selected.category] ?? ''}`}>
                    {selected.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[11px] capitalize ${statusColor[selected.status]}`}>
                    {selected.status}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    <History className="mr-1 h-3 w-3" />
                    v{selected.version}
                  </Badge>
                </div>
                <DialogTitle className="text-xl pr-8">{selected.title}</DialogTitle>
                <DialogDescription>
                  Owned by {selected.ownerUnit} · last updated{' '}
                  {format(parseISO(selected.lastUpdated), 'MMM d, yyyy')} · next review{' '}
                  {format(parseISO(selected.reviewDate), 'MMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Current Content
                  </h4>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.content}</p>
                  </div>
                </div>

                {selected.aiSuggestion && (
                  <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                        <Sparkles className="h-4 w-4" />
                        AI Auto-Update Suggestion
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                        disabled={regenerating === selected.id}
                        onClick={() => handleRegenerate(selected)}
                      >
                        {regenerating === selected.id ? (
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        {regenerating === selected.id ? 'Regenerating...' : 'Regenerate'}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
                      {selected.aiSuggestion}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Accept &amp; Draft v{(Number(selected.version.split('.').pop()) + 1).toString()}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Request Changes
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Version History
                  </h4>
                  <ScrollArea className="max-h-40">
                    <ol className="mt-2 space-y-2">
                      {[
                        { v: selected.version, date: selected.lastUpdated, note: 'Current — AI-assisted revision', active: true },
                        { v: decrement(selected.version), date: new Date(Date.now() - 30 * 86400000).toISOString(), note: 'Manual review — Risk Committee sign-off', active: false },
                        { v: decrement(decrement(selected.version)), date: new Date(Date.now() - 95 * 86400000).toISOString(), note: 'Annual refresh', active: false },
                      ].map((h) => (
                        <li
                          key={h.v}
                          className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                            h.active
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">v{h.v}</span>
                            <span className="text-slate-500">{h.note}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {format(parseISO(h.date), 'MMM d, yyyy')}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm">Export PDF</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Submit for Review
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function decrement(version: string): string {
  const parts = version.split('.').map(Number)
  if (parts.length < 3 || isNaN(parts[2])) return `${parts[0]}.${Math.max(0, (parts[1] ?? 1) - 1)}.0`
  const [maj, min, patch] = parts
  if (patch > 0) return `${maj}.${min}.${patch - 1}`
  if (min > 0) return `${maj}.${min - 1}.0`
  return `${Math.max(0, maj - 1)}.0.0`
}
