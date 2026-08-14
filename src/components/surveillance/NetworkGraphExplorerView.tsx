'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network, Users, GitFork, AlertTriangle, RotateCcw, Play, Pause, ZoomIn, ZoomOut } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type GNode = {
  id: string; label: string; type: string
  riskScore: number; jurisdiction: string; isFlagged: boolean
}
type GEdge = {
  id: string; source: string; target: string
  type: string; weight: number; currency: string; timestamp: string
}
type Cluster = { id: string; label: string; risk: number; nodeCount: number }

const typeColor: Record<string, string> = {
  person: '#8b5cf6',
  company: '#0ea5e9',
  account: '#10b981',
  address: '#f97316',
  crypto_wallet: '#f43f5e',
}

// ─────────────────────────────────────────────────────────────────────
// Force simulation state (kept in refs so React renders don't restart it)
// ─────────────────────────────────────────────────────────────────────
type SimNode = GNode & {
  x: number; y: number; vx: number; vy: number; fx: number | null; fy: number | null
}

export function NetworkGraphExplorerView() {
  const [nodes, setNodes] = useState<GNode[]>([])
  const [edges, setEdges] = useState<GEdge[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [rec, setRec] = useState<AIRec | null>(null)
  const [selected, setSelected] = useState<GNode | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(true)
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simNodes = useRef<SimNode[]>([])
  const simEdges = useRef<GEdge[]>([])
  const animFrame = useRef<number>(0)
  const dragNode = useRef<SimNode | null>(null)
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dims = useRef<{ w: number; h: number }>({ w: 720, h: 540 })
  const pan = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    fetch(dataUrl('network'))
      .then(r => r.json())
      .then(d => {
        setNodes(d.nodes ?? [])
        setEdges(d.edges ?? [])
        setClusters(d.clusters ?? [])
        setRec(d.aiRecommendation ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ─── Initialize simulation nodes once data loads ───
  useEffect(() => {
    if (nodes.length === 0) return
    simEdges.current = edges
    const W = dims.current.w, H = dims.current.h
    simNodes.current = nodes.map((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const r = Math.min(W, H) * 0.3
      return {
        ...n,
        x: W / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 30,
        y: H / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 30,
        vx: 0, vy: 0, fx: null, fy: null,
      }
    })
  }, [nodes, edges])

  // ─── Resize observer to keep canvas crisp ───
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width
        const h = 540
        dims.current = { w, h }
        const canvas = canvasRef.current
        if (!canvas) continue
        const dpr = window.devicePixelRatio || 1
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [loading])

  // ─── Force simulation step ───
  const step = useCallback(() => {
    const N = simNodes.current
    const E = simEdges.current
    if (N.length === 0) return
    const { w: W, h: H } = dims.current
    const cx = W / 2, cy = H / 2

    // Repulsion (O(n²) — fine for ~35 nodes)
    for (let i = 0; i < N.length; i++) {
      for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j]
        const dx = a.x - b.x, dy = a.y - b.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) dist = 1
        const force = 1800 / (dist * dist)
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        if (a.fx === null) { a.vx += fx; a.vy += fy }
        if (b.fx === null) { b.vx -= fx; b.vy -= fy }
      }
    }

    // Attraction along edges (Hooke's law)
    const edgeMap = new Map<string, SimNode>()
    N.forEach(n => edgeMap.set(n.id, n))
    for (const e of E) {
      const s = edgeMap.get(e.source), t = edgeMap.get(e.target)
      if (!s || !t) continue
      const dx = t.x - s.x, dy = t.y - s.y
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const ideal = 90
      const force = (dist - ideal) * 0.02
      const fx = (dx / dist) * force, fy = (dy / dist) * force
      if (s.fx === null) { s.vx += fx; s.vy += fy }
      if (t.fx === null) { t.vx -= fx; t.vy -= fy }
    }

    // Centering + damping + position update
    for (const n of N) {
      if (n.fx !== null) { n.x = n.fx; n.y = n.fy; continue }
      n.vx += (cx - n.x) * 0.005
      n.vy += (cy - n.y) * 0.005
      n.vx *= 0.85; n.vy *= 0.85
      n.x += n.vx; n.y += n.vy
      // Bounds
      n.x = Math.max(20, Math.min(W - 20, n.x))
      n.y = Math.max(20, Math.min(H - 20, n.y))
    }
  }, [])

  // ─── Render frame ───
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w: W, h: H } = dims.current
    ctx.clearRect(0, 0, W, H)

    // Background grid
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#f1f5f9'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    ctx.save()
    ctx.translate(pan.current.x, pan.current.y)
    ctx.scale(zoom, zoom)

    const N = simNodes.current
    const E = simEdges.current
    const nodeMap = new Map<string, SimNode>()
    N.forEach(n => nodeMap.set(n.id, n))
    const highlightId = hovered ?? selected?.id ?? null
    const connectedIds = new Set<string>(highlightId ? [highlightId] : [])
    if (highlightId) {
      for (const e of E) {
        if (e.source === highlightId) connectedIds.add(e.target)
        if (e.target === highlightId) connectedIds.add(e.source)
      }
    }

    // Edges
    for (const e of E) {
      const s = nodeMap.get(e.source), t = nodeMap.get(e.target)
      if (!s || !t) continue
      const isHigh = e.weight > 1_000_000
      const isHighlighted = highlightId && (e.source === highlightId || e.target === highlightId)
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(t.x, t.y)
      ctx.strokeStyle = isHighlighted
        ? (isHigh ? '#fb7185' : '#6366f1')
        : (isHigh ? '#fecdd3' : '#e2e8f0')
      ctx.lineWidth = isHighlighted ? 2 : (isHigh ? 1.4 : 0.6)
      ctx.globalAlpha = isHighlighted ? 0.95 : (highlightId ? 0.15 : 0.5)
      ctx.stroke()
      ctx.globalAlpha = 1

      // Flow direction arrow for highlighted edges
      if (isHighlighted) {
        const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2
        const ang = Math.atan2(t.y - s.y, t.x - s.x)
        ctx.save()
        ctx.translate(mx, my)
        ctx.rotate(ang)
        ctx.beginPath()
        ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-4, -4); ctx.closePath()
        ctx.fillStyle = isHigh ? '#fb7185' : '#6366f1'
        ctx.fill()
        ctx.restore()
      }
    }

    // Nodes
    for (const n of N) {
      const r = n.isFlagged ? 9 : 6
      const color = typeColor[n.type] ?? '#64748b'
      const isSel = selected?.id === n.id
      const isHov = hovered === n.id
      const isConn = connectedIds.has(n.id)
      const dim = highlightId && !isConn ? 0.25 : 1

      // Flagged pulse halo
      if (n.isFlagged) {
        const pulse = 1 + 0.15 * Math.sin(Date.now() / 300)
        ctx.beginPath()
        ctx.arc(n.x, n.y, (r + 5) * pulse, 0, 2 * Math.PI)
        ctx.strokeStyle = '#f43f5e'
        ctx.globalAlpha = 0.4 * dim
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      ctx.globalAlpha = dim
      ctx.beginPath()
      ctx.arc(n.x, n.y, r + (isSel ? 3 : 0), 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = isSel ? '#1e293b' : (isHov ? '#475569' : '#fff')
      ctx.lineWidth = isSel ? 2.5 : (isHov ? 2 : 1)
      ctx.stroke()

      // Risk label for high-risk nodes
      if (n.riskScore >= 75) {
        ctx.fillStyle = '#e11d48'
        ctx.font = 'bold 9px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(String(n.riskScore), n.x, n.y - r - 5)
      }
      // Label on hover/select
      if (isHov || isSel) {
        const label = n.label.length > 28 ? n.label.slice(0, 26) + '…' : n.label
        ctx.font = '11px ui-sans-serif, system-ui'
        const tw = ctx.measureText(label).width
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
        ctx.fillRect(n.x - tw / 2 - 5, n.y + r + 4, tw + 10, 16)
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.fillText(label, n.x, n.y + r + 15)
      }
      ctx.globalAlpha = 1
    }

    ctx.restore()

    // Legend (top-left, unscaled)
    let ly = 14
    ctx.font = '10px ui-sans-serif, system-ui'
    Object.entries(typeColor).forEach(([t, c]) => {
      ctx.beginPath()
      ctx.arc(18, ly + 4, 5, 0, 2 * Math.PI)
      ctx.fillStyle = c
      ctx.fill()
      ctx.fillStyle = '#475569'
      ctx.textAlign = 'left'
      ctx.fillText(t.replace(/_/g, ' '), 30, ly + 8)
      ly += 16
    })
  }, [hovered, selected, zoom])

  // ─── Animation loop ───
  useEffect(() => {
    if (loading || nodes.length === 0) return
    const loop = () => {
      if (running) step()
      draw()
      animFrame.current = requestAnimationFrame(loop)
    }
    animFrame.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame.current)
  }, [loading, nodes, running, step, draw])

  // ─── Mouse interaction ───
  const findNodeAt = (mx: number, my: number): SimNode | null => {
    for (const n of simNodes.current) {
      const r = n.isFlagged ? 9 : 6
      const dx = n.x - mx, dy = n.y - my
      if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return n
    }
    return null
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = (e.clientX - rect.left - pan.current.x) / zoom
    const my = (e.clientY - rect.top - pan.current.y) / zoom
    const n = findNodeAt(mx, my)
    if (n) {
      n.fx = n.x; n.fy = n.y
      dragNode.current = n
      setSelected(n)
    }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = (e.clientX - rect.left - pan.current.x) / zoom
    const my = (e.clientY - rect.top - pan.current.y) / zoom
    mousePos.current = { x: mx, y: my }
    if (dragNode.current) {
      dragNode.current.fx = mx
      dragNode.current.fy = my
    } else {
      const n = findNodeAt(mx, my)
      setHovered(n?.id ?? null)
      if (canvasRef.current) canvasRef.current.style.cursor = n ? 'pointer' : 'default'
    }
  }
  const onMouseUp = () => {
    if (dragNode.current) {
      // Release fix — let physics resume
      dragNode.current.fx = null
      dragNode.current.fy = null
      dragNode.current = null
    }
  }
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.4, Math.min(3, z * delta)))
  }

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const flagged = nodes.filter(n => n.isFlagged).length
  const totalFlow = edges.reduce((s, e) => s + e.weight, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Entity Network Explorer"
        subtitle="Live force-directed graph of counterparties, beneficial owners and fund flows — turning money laundering from a row problem into a graph problem. Drag any node to perturb the simulation; Louvain communities are colour-coded."
        icon={Network}
        accent="from-violet-500 to-fuchsia-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Entities" value={nodes.length} sub="persons · companies · accounts · wallets" icon={Users} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Relationships" value={edges.length} sub="ownership · txn · shared address" icon={GitFork} tint="text-sky-700 bg-sky-50" />
        <KpiTile label="Flagged" value={flagged} sub="risk ≥ 75" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Total Flow" value={`$${(totalFlow / 1e6).toFixed(1)}M`} sub={`across ${edges.length} edges`} icon={Network} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Force-Directed Network Topology — drag · hover · zoom</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setRunning(r => !r)} title={running ? 'Pause' : 'Play'}>
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(3, z * 1.2))} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.4, z / 1.2))} title="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setZoom(1); pan.current = { x: 0, y: 0 } }} title="Reset view">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div ref={containerRef} className="relative w-full">
              <canvas
                ref={canvasRef}
                className="rounded-lg touch-none"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={() => { onMouseUp(); setHovered(null) }}
                onWheel={onWheel}
              />
              <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                {running ? '● simulating' : '❚❚ paused'} · zoom {zoom.toFixed(2)}× · {nodes.length} nodes
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Detected Clusters — Louvain community detection</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {clusters.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{c.label}</p>
                    <p className="text-[10px] text-slate-400">{c.nodeCount} entities</p>
                  </div>
                  <Badge variant="outline" className={c.risk >= 80 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                    risk {c.risk}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Selected Entity</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  ['Label', selected.label],
                  ['Type', selected.type],
                  ['Jurisdiction', selected.jurisdiction],
                  ['Risk Score', `${selected.riskScore}/100`],
                  ['Flagged', selected.isFlagged ? 'YES — high risk' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {rec && <BooleanActionCard rec={rec} />}
        </div>
      </div>
    </div>
  )
}
