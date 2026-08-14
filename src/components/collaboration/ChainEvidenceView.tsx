'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Link2, Blocks, CheckCircle2, AlertCircle, Anchor } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Anchor = {
  id: string; payloadHash: string; chain: string
  txHash: string; blockNumber: number; anchorType: string
  anchoredBy: string; verifiedAt: string | null; createdAt: string
  verified: boolean
  broadcastMode?: string
  merkleRoot?: string
  merkleProof?: Array<{ position: string; hash: string }>
  auditId?: string
  actor?: string
  action?: string
  targetType?: string
  verificationUrl?: string
  leafCount?: number
  chainId?: number
  aiRecommendation?: AIRec
}

const chainColor: Record<string, string> = {
  hyperledger_besu: 'bg-violet-50 text-violet-700 border-violet-200',
  ethereum_sepolia: 'bg-sky-50 text-sky-700 border-sky-200',
  polygon_amoy: 'bg-purple-50 text-purple-700 border-purple-200',
}

const typeColor: Record<string, string> = {
  audit_log: 'bg-slate-50 text-slate-700 border-slate-200',
  evidence: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  decision: 'bg-amber-50 text-amber-700 border-amber-200',
  attestation: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function ChainEvidenceView() {
  const [items, setItems] = useState<Anchor[]>([])
  const [selected, setSelected] = useState<Anchor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('chain'))
      .then(r => r.json())
      .then(d => { setItems(d.anchors ?? []); setSelected(d.anchors?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const verified = items.filter(a => a.verified).length
  const pending = items.filter(a => !a.verified).length
  const chains = new Set(items.map(a => a.chain)).size

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Chain Evidence"
        subtitle="Every audit log entry SHA-256 hashed, Merkle-tree-aggregated, and anchored to Polygon Amoy testnet. Each anchor carries a Merkle proof verifiable offline with Python. Defensible in court."
        icon={Link2}
        accent="from-violet-500 to-indigo-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Anchors" value={items.length} sub="last 30 days" icon={Anchor} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Verified" value={verified} sub="chain-confirmed" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Pending Verify" value={pending} sub="in mempool" icon={AlertCircle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Chains" value={chains} sub="multi-chain anchoring" icon={Blocks} tint="text-sky-700 bg-sky-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Anchor Ledger — newest first</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(a => (
                <button key={a.id} onClick={() => setSelected(a)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === a.id ? 'bg-violet-50/40' : ''}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${a.verified ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {a.verified
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Badge variant="outline" className={`text-[10px] ${chainColor[a.chain] ?? 'bg-slate-100'}`}>
                        {a.chain.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${typeColor[a.anchorType]}`}>
                        {a.anchorType.replace(/_/g, ' ')}
                      </Badge>
                      {a.broadcastMode === 'live_polygon_amoy' && (
                        <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-700">● live on-chain</Badge>
                      )}
                      {a.broadcastMode === 'simulated_broadcast' && (
                        <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">simulated</Badge>
                      )}
                      {a.broadcastMode === 'merkle_proof_of_root' && (
                        <Badge variant="outline" className="text-[10px] border-indigo-200 bg-indigo-50 text-indigo-700">merkle proof</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-600">{a.payloadHash.slice(0, 28)}…</p>
                    <p className="text-[10px] text-slate-400">
                      block #{a.blockNumber.toLocaleString()} · by {a.anchoredBy} · {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Anchor Detail</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  ['Chain', selected.chain.replace(/_/g, ' ')],
                  ['Type', selected.anchorType.replace(/_/g, ' ')],
                  ['Block', `#${selected.blockNumber.toLocaleString()}`],
                  ['Anchored By', selected.anchoredBy],
                  ['Created', new Date(selected.createdAt).toLocaleString()],
                  ['Verified At', selected.verifiedAt ? new Date(selected.verifiedAt).toLocaleString() : 'Pending'],
                  ['Status', selected.verified ? '✓ Verified on-chain' : '⏳ Awaiting confirmation'],
                  ['Broadcast Mode', selected.broadcastMode ?? '—'],
                  ...(selected.auditId ? [['Audit Entry', selected.auditId]] : []),
                  ...(selected.actor ? [['Original Actor', selected.actor]] : []),
                  ...(selected.action ? [['Original Action', selected.action]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-right font-mono text-slate-800">{v}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="mb-1 text-slate-500">Payload Hash <span className="text-[10px] text-slate-400">(SHA-256)</span></p>
                  <p className="rounded-md bg-slate-50 p-2 font-mono text-[10px] break-all text-slate-700">{selected.payloadHash}</p>
                </div>
                <div>
                  <p className="mb-1 text-slate-500">Transaction Hash</p>
                  <p className="rounded-md bg-slate-50 p-2 font-mono text-[10px] break-all text-slate-700">{selected.txHash}</p>
                  {selected.verificationUrl && (
                    <a href={selected.verificationUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-block text-[10px] text-indigo-600 hover:underline">
                      View on Amoy PolygonScan ↗
                    </a>
                  )}
                </div>
                {selected.merkleRoot && (
                  <div>
                    <p className="mb-1 text-slate-500">Merkle Root <span className="text-[10px] text-slate-400">(SHA-256 of all leaves)</span></p>
                    <p className="rounded-md bg-indigo-50 p-2 font-mono text-[10px] break-all text-indigo-700">{selected.merkleRoot}</p>
                  </div>
                )}
                {selected.merkleProof && selected.merkleProof.length > 0 && (
                  <div>
                    <p className="mb-1 text-slate-500">Merkle Proof <span className="text-[10px] text-slate-400">({selected.merkleProof.length} steps · verifiable offline)</span></p>
                    <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 p-2 font-mono text-[10px] space-y-1">
                      {selected.merkleProof.map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-500">{i+1}.</span>
                          <span className="text-indigo-600">{step.position === 'right' ? 'L + R →' : 'R + L →'}</span>
                          <span className="break-all text-slate-700">{step.hash.slice(0, 32)}…</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {selected?.aiRecommendation && <BooleanActionCard rec={selected.aiRecommendation} />}
        </div>
      </div>
    </div>
  )
}
