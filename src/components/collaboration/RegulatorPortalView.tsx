'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Landmark, FileText, Eye, Lock, CheckCircle2 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Examiner = {
  name: string; agency: string; examinationId: string
  scopedEntities: string[]; scopedDateRange: string[]
}
type Query = { id: string; query: string; timestamp: string; recordsReturned: number; logged: boolean }
type Doc = { id: string; type: string; title: string; scoped: boolean }

export function RegulatorPortalView() {
  const [examiner, setExaminer] = useState<Examiner | null>(null)
  const [queries, setQueries] = useState<Query[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [rec, setRec] = useState<AIRec | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('regulator-portal'))
      .then(r => r.json())
      .then(d => { setExaminer(d.examiner); setQueries(d.queries ?? []); setDocs(d.availableDocuments ?? []); setRec(d.aiRecommendation) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Regulator Portal"
        subtitle="Read-only, scoped examiner view — they see what they're entitled to, every query they make is itself logged and anchored to the chain."
        icon={Landmark}
        accent="from-amber-500 to-yellow-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Examiner" value={examiner?.name.split(' ').slice(-1)[0] ?? '—'} sub={examiner?.agency ?? ''} icon={Landmark} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Exam ID" value={(examiner?.examinationId ?? '').slice(-6)} sub={examiner?.examinationId} icon={FileText} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Scoped Entities" value={examiner?.scopedEntities.length ?? 0} sub={(examiner?.scopedEntities ?? []).join(' · ')} icon={Eye} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Queries Logged" value={queries.length} sub="every query on chain" icon={Lock} tint="text-rose-700 bg-rose-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Examiner Query Log — every search is anchored</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {queries.map(q => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">&ldquo;{q.query}&rdquo;</p>
                  <p className="text-[10px] text-slate-400">{new Date(q.timestamp).toLocaleString()} · {q.recordsReturned} records returned</p>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Logged
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Entitlement-Scoped Documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {docs.map(d => (
                <div key={d.id} className={`flex items-center justify-between rounded-lg border p-2.5 ${d.scoped ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40 opacity-60'}`}>
                  <div>
                    <p className="text-xs font-medium text-slate-700">{d.title}</p>
                    <p className="text-[10px] text-slate-400">{d.type}</p>
                  </div>
                  <Badge variant="outline" className={d.scoped ? 'border-emerald-200 bg-white text-emerald-700' : 'border-rose-200 bg-white text-rose-700'}>
                    {d.scoped ? 'Visible' : 'Restricted'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {rec && <BooleanActionCard rec={rec} />}
        </div>
      </div>
    </div>
  )
}
