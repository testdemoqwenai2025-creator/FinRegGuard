/**
 * Catch-all view data API.
 * Returns a curated, realistic payload for each of the 22 new state machines.
 * Each payload includes metrics, charts, highlights, and a live-records table.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ viewKey: string }> },
) {
  const { viewKey } = await params
  try {
    const payload = await buildPayload(viewKey)
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'failed to build view payload' },
      { status: 500 },
    )
  }
}

async function buildPayload(viewKey: string) {
  switch (viewKey) {
    // ─── Surveillance ─────────────────────────────────────────
    case 'transaction-surveillance': {
      const alerts = await db.surveillanceAlert.findMany({ take: 25, orderBy: { timestamp: 'desc' } })
      const critical = alerts.filter((a) => a.severity === 'critical').length
      const open = alerts.filter((a) => a.status === 'open' || a.status === 'under_review').length
      return {
        metrics: [
          { label: 'Open alerts', value: String(open), trend: 'under review', intent: 'warn' as const },
          { label: 'Critical', value: String(critical), trend: 'escalated', intent: 'bad' as const },
          { label: 'Avg risk score', value: String(Math.round(alerts.reduce((s, a) => s + a.riskScore, 0) / (alerts.length || 1))), trend: 'stable', intent: 'neutral' as const },
          { label: 'P99 latency', value: '847ms', trend: 'within SLA', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Severity distribution', data: [
            { label: 'Critical', value: alerts.filter((a) => a.severity === 'critical').length, color: '#ef4444' },
            { label: 'High', value: alerts.filter((a) => a.severity === 'high').length, color: '#f59e0b' },
            { label: 'Medium', value: alerts.filter((a) => a.severity === 'medium').length, color: '#0ea5e9' },
            { label: 'Low', value: alerts.filter((a) => a.severity === 'low').length, color: '#10b981' },
          ]},
          { type: 'bars' as const, title: 'Alerts by channel', data: channelCounts(alerts) },
        ],
        highlights: [
          { title: 'Sub-$10k structuring pattern', body: 'ACC-44120 triggered 5 wires in 5 days, each just under the $10k CTR threshold. Auto-escalated to FinCEN SAR queue.', intent: 'bad' as const },
          { title: 'Cross-border layering', body: '€2.4M moved CY→MT→SG→PA within 117 minutes via 4 correspondent banks. Geographic velocity rule TM-018 fired.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Type', 'Severity', 'Counterparty', 'Amount', 'Channel', 'Risk', 'Status'],
          rows: alerts.slice(0, 12).map((a) => [
            a.alertType, a.severity, a.counterparty,
            `${a.amount.toLocaleString()} ${a.currency}`,
            a.channel, a.riskScore, a.status,
          ]),
        },
      }
    }

    case 'comms-surveillance': {
      const events = await db.commsEvent.findMany({ take: 25, orderBy: { timestamp: 'desc' } })
      const escalated = events.filter((e) => e.status === 'escalated').length
      return {
        metrics: [
          { label: 'Monitored channels', value: '5', trend: 'voice/email/chat/mobile/bbg', intent: 'neutral' as const },
          { label: 'Signals (24h)', value: String(events.length), trend: 'review queue', intent: 'warn' as const },
          { label: 'Escalated', value: String(escalated), trend: 'to surveillance', intent: 'bad' as const },
          { label: 'Coverage', value: '99.4%', trend: 'recording uptime', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Signals by desk', data: deskCounts(events) },
          { type: 'donut' as const, title: 'Signal types', data: signalTypeCounts(events) },
        ],
        highlights: [
          { title: 'Insider trading signal', body: 'Analyst_sl emailed cousin_pj with merger ticker code 4 days before announcement. Risk score 95. Manual escalation in progress.', intent: 'bad' as const },
          { title: 'Off-channel comms growth', body: 'Mobile + Teams off-channel signals up 23% MoM. Recommending USB lockdown on wealth desk.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Channel', 'Desk', 'Signal', 'Risk', 'Status', 'Snippet'],
          rows: events.slice(0, 12).map((e) => [
            e.channel, e.desk, e.signalType, e.riskScore, e.status, e.transcript.slice(0, 80) + '…',
          ]),
        },
      }
    }

    case 'sanctions-screening': {
      const hits = await db.sanctionsHit.findMany({ take: 25, orderBy: { timestamp: 'desc' } })
      const tp = hits.filter((h) => h.status === 'true_positive').length
      const fp = hits.filter((h) => h.status === 'false_positive').length
      return {
        metrics: [
          { label: 'Hits (24h)', value: String(hits.length), trend: 'screening queue', intent: 'warn' as const },
          { label: 'True positives', value: String(tp), trend: 'auto-blocked', intent: 'bad' as const },
          { label: 'False positives', value: String(fp), trend: 'auto-cleared', intent: 'good' as const },
          { label: 'Match latency', value: '12ms', trend: 'sub-50ms target', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'By list', data: listCounts(hits) },
          { type: 'bars' as const, title: 'By match type', data: matchTypeCounts(hits) },
        ],
        highlights: [
          { title: 'Exact match: Rostec Holding BV', body: 'EU Consolidated #4521 — score 100. Transaction blocked, SAR filed. Counterparty account frozen.', intent: 'bad' as const },
          { title: 'Phonetic match cleared', body: 'Kim Soo-yeon matched UN #2218 phonetically but cleared on DOB mismatch. False positive rationale documented.', intent: 'good' as const },
        ],
        table: {
          columns: ['List', 'Match Type', 'Matched Name', 'Entity', 'Score', 'Status'],
          rows: hits.slice(0, 12).map((h) => [
            h.listName, h.matchType, h.matchedName, h.listedEntity, h.score, h.status,
          ]),
        },
      }
    }

    case 'network-graph': {
      const alerts = await db.surveillanceAlert.findMany({ take: 50 })
      const uniqueCounterparties = new Set(alerts.map((a) => a.counterparty)).size
      return {
        metrics: [
          { label: 'Entities', value: String(uniqueCounterparties + 18), trend: 'resolved', intent: 'neutral' as const },
          { label: 'Edges', value: String(alerts.length * 3 + 47), trend: 'transactions', intent: 'neutral' as const },
          { label: 'Clusters', value: '7', trend: 'suspicious sub-graphs', intent: 'warn' as const },
          { label: 'Avg path length', value: '2.4', trend: 'within norm', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Top counterparties by risk', data: topCounterparties(alerts) },
        ],
        highlights: [
          { title: 'Cluster: Dubex Trading constellation', body: 'Force-directed layout revealed 11 entities sharing 4 phone numbers and 2 beneficial owners. Pattern consistent with smurfing network.', intent: 'bad' as const },
          { title: 'Bridge node: Helix Holdings BVI', body: 'Single entity acts as bridge between 3 suspicious clusters. Recommending enhanced due diligence.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Counterparty', 'Connections', 'Total Volume', 'Risk Score', 'Cluster ID'],
          rows: topCounterparties(alerts).map((d, i) => [d.label, Math.floor(d.value / 100), d.value, 60 + i * 5, `CL-${100 + i}`]),
        },
      }
    }

    // ─── Quant & Computational ────────────────────────────────
    case 'quant-lab': {
      const scenarios = await db.quantScenario.findMany()
      return {
        metrics: [
          { label: 'Scenarios', value: String(scenarios.length), trend: 'in library', intent: 'neutral' as const },
          { label: 'Running now', value: String(scenarios.filter((s) => s.status === 'running').length), trend: 'live', intent: 'warn' as const },
          { label: 'Capital impact', value: '-$465M', trend: 'aggregate stress', intent: 'bad' as const },
          { label: 'Compute hours', value: '14,287', trend: 'this quarter', intent: 'neutral' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'P99 loss by scenario ($M)', data: scenarios.map((s) => ({ label: s.scenarioType, value: Math.round(s.p99Loss / 1_000_000) })) },
          { type: 'donut' as const, title: 'Scenario status', data: [
            { label: 'Complete', value: scenarios.filter((s) => s.status === 'complete').length, color: '#10b981' },
            { label: 'Running', value: scenarios.filter((s) => s.status === 'running').length, color: '#0ea5e9' },
            { label: 'Draft', value: scenarios.filter((s) => s.status === 'draft').length, color: '#f59e0b' },
          ]},
        ],
        highlights: [
          { title: 'CCAR Severely Adverse', body: 'P99 loss $4.28B; CET1 impact -185bps. Within board risk appetite but tighter than prior cycle.', intent: 'warn' as const },
          { title: 'Stablecoin depeg scenario', body: 'Hypothetical USDT -20bps depeg with cascading DeFi liquidations. P99 loss $612M. Draft — pending CRO review.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Scenario', 'Horizon', 'P99 Loss ($B)', 'Capital Impact (bps)', 'Status'],
          rows: scenarios.map((s) => [
            s.scenarioType, s.timeHorizon, (s.p99Loss / 1e9).toFixed(2), s.capitalImpact, s.status,
          ]),
        },
      }
    }

    case 'climate-esg': {
      const metrics = await db.climateMetric.findMany({ orderBy: { reportingPeriod: 'desc' } })
      const latest = metrics[0]
      return {
        metrics: [
          { label: 'Scope 1+2 (tCO2e)', value: (latest?.scope1Emissions! + latest?.scope2Emissions!).toLocaleString(), trend: '-4.4% YoY', intent: 'good' as const },
          { label: 'Scope 3 (tCO2e)', value: latest?.scope3Emissions!.toLocaleString(), trend: '-5.1% YoY', intent: 'good' as const },
          { label: 'Financed emissions', value: (latest?.financedEmissions! / 1e6).toFixed(1) + ' Mt', trend: 'PCAF aligned', intent: 'neutral' as const },
          { label: 'EU Taxonomy aligned', value: latest?.taxonomyAlignment + '%', trend: '+4.5pp', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Emissions by scope (tCO2e)', data: [
            { label: 'Scope 1', value: latest?.scope1Emissions! },
            { label: 'Scope 2', value: latest?.scope2Emissions! },
            { label: 'Scope 3', value: Math.round(latest?.scope3Emissions! / 100) },
            { label: 'Financed (/1k)', value: Math.round(latest?.financedEmissions! / 1000) },
          ]},
          { type: 'donut' as const, title: 'Risk scores', data: [
            { label: 'Physical', value: latest?.physicalRiskScore!, color: '#f59e0b' },
            { label: 'Transition', value: latest?.transitionRiskScore!, color: '#ef4444' },
            { label: 'Headroom', value: 100 - (latest?.physicalRiskScore! + latest?.transitionRiskScore!) / 2, color: '#10b981' },
          ]},
        ],
        highlights: [
          { title: 'NGFS disorderly transition', body: 'Transition risk score 74 — funded emissions concentrated in energy sector exposed to $120/tCO2 carbon price by 2030.', intent: 'warn' as const },
          { title: 'Physical risk hotspots', body: 'Collateral book has $2.8B exposure to flood-risk zones in FL + TX. Recommending LTV adjustments.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Period', 'Scope 1', 'Scope 2', 'Scope 3', 'Financed', 'Taxonomy %', 'Physical', 'Transition'],
          rows: metrics.map((m) => [
            m.reportingPeriod,
            m.scope1Emissions.toLocaleString(),
            m.scope2Emissions.toLocaleString(),
            m.scope3Emissions.toLocaleString(),
            (m.financedEmissions / 1e6).toFixed(1) + ' Mt',
            m.taxonomyAlignment + '%',
            m.physicalRiskScore,
            m.transitionRiskScore,
          ]),
        },
      }
    }

    case 'counterfactual': {
      return {
        metrics: [
          { label: 'Scenarios run', value: '47', trend: 'this month', intent: 'neutral' as const },
          { label: 'Avg compute', value: '12.4 min', trend: 'within budget', intent: 'good' as const },
          { label: 'Material impacts', value: '8', trend: '>50bps CET1', intent: 'warn' as const },
          { label: 'Confidence', value: '92%', trend: 'validated', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'CET1 impact by hypothetical (bps)', data: [
            { label: 'Fed +200bps', value: -42 },
            { label: 'MiFID III passes', value: -18 },
            { label: 'Sovereign default (IT)', value: -127 },
            { label: 'Stablecoin ban', value: -8 },
            { label: 'CBDC 30% adoption', value: -23 },
            { label: 'Climate shock NGFS', value: -78 },
          ]},
          { type: 'line' as const, title: 'Projected CET1 trajectory (12 mo)', data: [
            { label: 'M0', value: 14.2 }, { label: 'M3', value: 14.0 }, { label: 'M6', value: 13.7 },
            { label: 'M9', value: 13.4 }, { label: 'M12', value: 13.1 },
          ]},
        ],
        highlights: [
          { title: 'Counterfactual: Italian sovereign default', body: 'Sovereign exposure €3.8B + cascading bank counterparty risk. CET1 impact -127bps. Recommend hedging via CDS on Italian banks.', intent: 'bad' as const },
          { title: 'Counterfactual: MiFID III passage', body: 'Best-execution obligations tightened; estimated €42M incremental compliance cost. CET1 impact -18bps. Manageable.', intent: 'warn' as const },
        ],
      }
    }

    case 'systemic-risk': {
      return {
        metrics: [
          { label: 'Interbank nodes', value: '247', trend: 'resolved graph', intent: 'neutral' as const },
          { label: 'Avg DebtRank', value: '0.084', trend: 'within norm', intent: 'good' as const },
          { label: 'Systemic banks', value: '12', trend: 'high DebtRank', intent: 'warn' as const },
          { label: 'CCP exposure', value: '$48B', trend: 'concentrated', intent: 'warn' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Top 8 banks by DebtRank', data: [
            { label: 'Bank-A', value: 0.21 }, { label: 'Bank-B', value: 0.18 }, { label: 'Bank-C', value: 0.15 },
            { label: 'Bank-D', value: 0.13 }, { label: 'Bank-E', value: 0.11 }, { label: 'Bank-F', value: 0.09 },
            { label: 'Bank-G', value: 0.08 }, { label: 'Bank-H', value: 0.07 },
          ]},
          { type: 'donut' as const, title: 'CCP exposure by asset class', data: [
            { label: 'Rates', value: 22, color: '#0ea5e9' },
            { label: 'Credit', value: 14, color: '#8b5cf6' },
            { label: 'FX', value: 8, color: '#10b981' },
            { label: 'Equities', value: 4, color: '#f59e0b' },
          ]},
        ],
        highlights: [
          { title: 'Cascading failure simulation', body: 'Default of Bank-A triggers 4-second wave impacting 38% of interbank network. Recommend enhanced monitoring of Bank-A liquidity.', intent: 'bad' as const },
          { title: 'CCP concentration risk', body: '$48B concentrated at 3 CCPs. Waterfall analysis suggests 2-of-3 CCPs can absorb member default; 1 cannot.', intent: 'warn' as const },
        ],
      }
    }

    // ─── Intelligence & Automation ────────────────────────────
    case 'agent-console': {
      const runs = await db.agentRun.findMany({ take: 25, orderBy: { startedAt: 'desc' } })
      const running = runs.filter((r) => r.status === 'running').length
      const awaiting = runs.filter((r) => r.status === 'awaiting_approval').length
      return {
        metrics: [
          { label: 'Active agents', value: '4', trend: 'always-on', intent: 'neutral' as const },
          { label: 'Runs (7d)', value: String(runs.length * 12), trend: 'rolling', intent: 'neutral' as const },
          { label: 'Awaiting approval', value: String(awaiting), trend: 'human-in-loop', intent: 'warn' as const },
          { label: 'Running now', value: String(running), trend: 'live', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Run status', data: [
            { label: 'Complete', value: runs.filter((r) => r.status === 'complete').length, color: '#10b981' },
            { label: 'Running', value: running, color: '#0ea5e9' },
            { label: 'Awaiting', value: awaiting, color: '#f59e0b' },
            { label: 'Queued', value: runs.filter((r) => r.status === 'queued').length, color: '#94a3b8' },
          ]},
          { type: 'bars' as const, title: 'By agent', data: agentCounts(runs) },
        ],
        highlights: [
          { title: 'Policy drafter awaiting CCO sign-off', body: 'AML Policy v3.2 redline (14 edits) generated in response to FinCEN BOI rule. CCO approval pending — 4-day SLA.', intent: 'warn' as const },
          { title: 'Regulatory watcher caught 3 high-impact items', body: '47 new items scraped overnight, 3 flagged high-impact (EBA DORA, MAS individual accountability, BoE Basel 3.1).', intent: 'good' as const },
        ],
        table: {
          columns: ['Agent', 'Task', 'Status', 'Tools', 'Approved By'],
          rows: runs.slice(0, 12).map((r) => [
            r.agentName, r.task.slice(0, 60), r.status, r.toolsUsed, r.approvedBy || '—',
          ]),
        },
      }
    }

    case 'regulatory-watch': {
      const changes = await db.regulatoryChange.findMany({ take: 25, orderBy: { publishedAt: 'desc' } })
      return {
        metrics: [
          { label: 'Sources monitored', value: '12', trend: 'rss + api', intent: 'neutral' as const },
          { label: 'New items (7d)', value: String(changes.length * 8), trend: 'auto-classified', intent: 'neutral' as const },
          { label: 'High impact', value: String(changes.filter((c) => c.impactScore > 80).length), trend: 'requires action', intent: 'warn' as const },
          { label: 'Auto-applied', value: String(changes.filter((c) => c.status === 'applied').length), trend: 'policy updates', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'By jurisdiction', data: jurisdictionCounts(changes) },
          { type: 'donut' as const, title: 'Triage status', data: [
            { label: 'New', value: changes.filter((c) => c.status === 'new').length, color: '#0ea5e9' },
            { label: 'Triaged', value: changes.filter((c) => c.status === 'triaged').length, color: '#f59e0b' },
            { label: 'Drafting', value: changes.filter((c) => c.status === 'drafting').length, color: '#8b5cf6' },
            { label: 'Applied', value: changes.filter((c) => c.status === 'applied').length, color: '#10b981' },
          ]},
        ],
        highlights: [
          { title: 'EBA DORA alignment guideline', body: 'Impact score 92 — affects TECH-OPS-001 and BCP-003. Auto-drafted policy redline pending CTO review.', intent: 'warn' as const },
          { title: 'MAS individual accountability', body: 'Impact score 65 — extends SMR to material risk-takers. Policy GOVERNANCE-002 update drafted.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Source', 'Title', 'Jurisdiction', 'Impact', 'Affected', 'Status'],
          rows: changes.slice(0, 12).map((c) => [
            c.source, c.title.slice(0, 50), c.jurisdiction, c.impactScore, c.affectedPolicies.slice(0, 30), c.status,
          ]),
        },
      }
    }

    case 'red-team': {
      const tests = await db.redTeamTest.findMany({ take: 25, orderBy: { timestamp: 'desc' } })
      const bypassed = tests.filter((t) => t.result === 'bypassed').length
      return {
        metrics: [
          { label: 'Tests (7d)', value: String(tests.length * 3), trend: 'continuous', intent: 'neutral' as const },
          { label: 'Blocked', value: String(tests.filter((t) => t.result === 'blocked').length), trend: 'control working', intent: 'good' as const },
          { label: 'Detected', value: String(tests.filter((t) => t.result === 'detected').length), trend: 'flagged', intent: 'good' as const },
          { label: 'Bypassed', value: String(bypassed), trend: 'remediate', intent: 'bad' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Outcome', data: [
            { label: 'Blocked', value: tests.filter((t) => t.result === 'blocked').length, color: '#10b981' },
            { label: 'Detected', value: tests.filter((t) => t.result === 'detected').length, color: '#0ea5e9' },
            { label: 'Bypassed', value: bypassed, color: '#ef4444' },
          ]},
          { type: 'bars' as const, title: 'By attack vector', data: attackVectorCounts(tests) },
        ],
        highlights: [
          { title: 'CRITICAL: Insider trading signal evasion', body: 'Coded language ("the cake is ready") bypassed pattern matcher 4/4 times. Remediation: add contextual embedding classifier.', intent: 'bad' as const },
          { title: 'Sanctions list substring obfuscation', body: '3 of 10 obfuscated name variants passed screening. Fuzzy threshold tightened from 85→78.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Test', 'Attack Vector', 'Target', 'Result', 'Severity', 'Remediation'],
          rows: tests.slice(0, 12).map((t) => [
            t.testName.slice(0, 35), t.attackVector, t.target.slice(0, 30), t.result, t.severity, (t.remediation || '—').slice(0, 40),
          ]),
        },
      }
    }

    case 'knowledge-graph': {
      return {
        metrics: [
          { label: 'Nodes', value: '14,872', trend: 'regulations+controls', intent: 'neutral' as const },
          { label: 'Edges', value: '47,201', trend: 'cross-refs', intent: 'neutral' as const },
          { label: 'Embeddings', value: '14,872', trend: '1536-dim vectors', intent: 'good' as const },
          { label: 'Avg retrieval', value: '47ms', trend: 'p95 within SLA', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Nodes by type', data: [
            { label: 'Regulation', value: 412 },
            { label: 'Policy', value: 287 },
            { label: 'Control', value: 1842 },
            { label: 'Evidence', value: 8971 },
            { label: 'Risk', value: 3360 },
          ]},
          { type: 'donut' as const, title: 'Edge types', data: [
            { label: 'regulates', value: 18420, color: '#10b981' },
            { label: 'implements', value: 9200, color: '#0ea5e9' },
            { label: 'evidences', value: 12800, color: '#f59e0b' },
            { label: 'mitigates', value: 6781, color: '#8b5cf6' },
          ]},
        ],
        highlights: [
          { title: 'Impact query: MiFID II Art 27 amendment', body: 'Graph traversal identifies 14 policies, 47 controls, 312 evidence artifacts affected. Auto-generated impact memo ready for CCO review.', intent: 'good' as const },
          { title: 'Vector RAG: "what is our consumer duty approach?"', body: 'Retrieved 8 most semantically relevant policies + controls + evidence in 47ms. Cited response with 23 references.', intent: 'good' as const },
        ],
      }
    }

    // ─── Collaboration & Trust ────────────────────────────────
    case 'case-management': {
      const cases = await db.complianceCase.findMany({ take: 25, orderBy: { updatedAt: 'desc' } })
      const open = cases.filter((c) => c.status === 'open' || c.status === 'in_progress').length
      return {
        metrics: [
          { label: 'Open cases', value: String(open), trend: 'active', intent: 'warn' as const },
          { label: 'Critical', value: String(cases.filter((c) => c.priority === 'critical').length), trend: 'examinations', intent: 'bad' as const },
          { label: 'SLA at risk', value: '2', trend: '<7d remaining', intent: 'warn' as const },
          { label: 'Avg close time', value: '21d', trend: '-12% QoQ', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'By case type', data: caseTypeCounts(cases) },
          { type: 'bars' as const, title: 'By priority', data: priorityCounts(cases) },
        ],
        highlights: [
          { title: 'OCC Risk Committee Examination', body: 'Critical priority. 14 evidence requests outstanding, 28 days remaining. Risk committee charter, minutes, and challenge documentation requested.', intent: 'bad' as const },
          { title: 'FCA s.165 request — Consumer Duty', body: 'High priority. 4 of 8 evidence packs complete. 7 days remaining. Fair value framework for 8 retail products requested.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Type', 'Title', 'Regulator', 'Priority', 'Status', 'Assignee', 'Due'],
          rows: cases.slice(0, 12).map((c) => [
            c.caseType, c.title.slice(0, 35), c.regulator || '—', c.priority, c.status, c.assignee,
            c.dueDate.toISOString().slice(0, 10),
          ]),
        },
      }
    }

    case 'regulator-portal': {
      return {
        metrics: [
          { label: 'Active examiners', value: '7', trend: 'from 4 regulators', intent: 'neutral' as const },
          { label: 'Sessions (30d)', value: '142', trend: 'audit logged', intent: 'good' as const },
          { label: 'Documents viewed', value: '2,847', trend: 'all tracked', intent: 'good' as const },
          { label: 'Scope compliance', value: '100%', trend: 'no over-disclosure', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Active sessions by regulator', data: [
            { label: 'OCC', value: 3, color: '#10b981' },
            { label: 'FCA', value: 2, color: '#0ea5e9' },
            { label: 'ECB', value: 1, color: '#f59e0b' },
            { label: 'FINRA', value: 1, color: '#8b5cf6' },
          ]},
          { type: 'bars' as const, title: 'Documents accessed (30d)', data: [
            { label: 'AML', value: 847 },
            { label: 'Capital', value: 612 },
            { label: 'Consumer Duty', value: 521 },
            { label: 'Market Risk', value: 467 },
            { label: 'Climate', value: 400 },
          ]},
        ],
        highlights: [
          { title: 'Examiner query log', body: 'Every document opened, search run, and download performed by examiners is itself logged. Produces clean examination footprint.', intent: 'good' as const },
          { title: 'Scope enforcement', body: 'Examiner attempt to access unrelated credit risk file was blocked and logged. Auto-generated disclosure report available for the examiner.', intent: 'good' as const },
        ],
      }
    }

    case 'whistleblower': {
      const reports = await db.whistleblowerReport.findMany({ take: 25, orderBy: { createdAt: 'desc' } })
      return {
        metrics: [
          { label: 'Reports (90d)', value: String(reports.length * 3), trend: 'rolling', intent: 'neutral' as const },
          { label: 'Investigating', value: String(reports.filter((r) => r.status === 'investigating').length), trend: 'active', intent: 'warn' as const },
          { label: 'Critical', value: String(reports.filter((r) => r.severity === 'critical').length), trend: 'priority', intent: 'bad' as const },
          { label: 'Avg triage', value: '14 min', trend: 'LLM-assisted', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'By category', data: categoryCounts(reports) },
          { type: 'bars' as const, title: 'By severity', data: severityCountsW(reports) },
        ],
        highlights: [
          { title: 'Market abuse report — trader equities desk', body: 'Anonymous report of trader discussing client order flow on personal phone. Triage score 91. Cross-referenced with comms surveillance — corroborating evidence found.', intent: 'bad' as const },
          { title: 'Fraud report — Branch 47', body: 'Income figure inflation on loan applications. Triage score 84. HR + Branch Operations joint investigation opened.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Category', 'Severity', 'Status', 'Triage', 'Assigned', 'Anonymous'],
          rows: reports.slice(0, 12).map((r) => [
            r.category, r.severity, r.status, r.triageScore || '—', r.assignedTo || '—', r.anonymous ? 'Yes' : 'No',
          ]),
        },
      }
    }

    case 'chain-evidence': {
      const anchors = await db.chainAnchor.findMany({ take: 25, orderBy: { createdAt: 'desc' } })
      return {
        metrics: [
          { label: 'Anchored (30d)', value: String(anchors.length * 1240), trend: 'continuous', intent: 'neutral' as const },
          { label: 'Verified', value: String(anchors.filter((a) => a.verifiedAt).length), trend: 'on-chain check', intent: 'good' as const },
          { label: 'Chains', value: '3', trend: 'Besu + Sepolia + Polygon', intent: 'neutral' as const },
          { label: 'Tamper attempts', value: '0', trend: 'all blocked', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'By chain', data: chainCounts(anchors) },
          { type: 'donut' as const, title: 'By anchor type', data: anchorTypeCounts(anchors) },
        ],
        highlights: [
          { title: 'Hyperledger Besu validator node', body: 'Running 4-validator permissioned Besu network. Regulator read-only nodes available for OCC, FCA, ECB.', intent: 'good' as const },
          { title: 'Cryptographic verification', body: 'Every audit log entry hashed (SHA-256) and anchored. Verification job re-anchors entire daily set — any tampering detected within 24h.', intent: 'good' as const },
        ],
        table: {
          columns: ['Chain', 'Block #', 'Type', 'Anchored By', 'Verified', 'Tx Hash'],
          rows: anchors.slice(0, 12).map((a) => [
            a.chain, a.blockNumber.toLocaleString(), a.anchorType, a.anchoredBy,
            a.verifiedAt ? '✓' : 'pending', a.txHash.slice(0, 18) + '…',
          ]),
        },
      }
    }

    case 'digital-assets': {
      const events = await db.digitalAssetEvent.findMany({ take: 25, orderBy: { timestamp: 'desc' } })
      return {
        metrics: [
          { label: 'Events (24h)', value: String(events.length * 47), trend: 'streaming', intent: 'neutral' as const },
          { label: 'Blocked', value: String(events.filter((e) => e.status === 'blocked').length), trend: 'sanctions hits', intent: 'bad' as const },
          { label: 'Flagged', value: String(events.filter((e) => e.status === 'flagged').length), trend: 'review queue', intent: 'warn' as const },
          { label: 'Travel Rule compliance', value: '100%', trend: 'FATF R.16', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'By event type', data: digitalEventTypeCounts(events) },
          { type: 'bars' as const, title: 'By asset', data: digitalAssetCounts(events) },
        ],
        highlights: [
          { title: 'OFAC match — USDT on Tron', body: 'Wallet 0xdef456...012abc linked to SDN entity. $250k USDT transaction blocked. SAR filed.', intent: 'bad' as const },
          { title: 'Mixer exposure detected', body: 'ETH wallet 0x742d35Cc...6634C0 received funds from Tornado Cash. Risk score 89. Transaction flagged for manual review.', intent: 'warn' as const },
        ],
        table: {
          columns: ['Asset', 'Chain', 'Event', 'Amount', 'Risk', 'Status'],
          rows: events.slice(0, 12).map((e) => [
            e.asset, e.chain, e.eventType, e.amount.toLocaleString(), e.riskScore, e.status,
          ]),
        },
      }
    }

    // ─── Platform & Governance ────────────────────────────────
    case 'privacy-pets': {
      const configs = await db.petConfig.findMany()
      return {
        metrics: [
          { label: 'Techniques deployed', value: String(configs.filter((c) => c.enabled).length), trend: 'production', intent: 'good' as const },
          { label: 'Datasets protected', value: String(configs.length), trend: 'covered', intent: 'neutral' as const },
          { label: 'Federated rounds', value: '1,247', trend: 'cross-bank AML', intent: 'good' as const },
          { label: 'DP epsilon budget', value: '4.0', trend: 'within limit', intent: 'good' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Techniques', data: petTechniqueCounts(configs) },
        ],
        highlights: [
          { title: 'Cross-bank federated AML', body: '5-bank federated learning cluster trained 50 rounds. AML model F1 +6.4pp vs in-house only. No raw data shared.', intent: 'good' as const },
          { title: 'Secure enclave for sanctions', body: 'AWS Nitro Enclave isolates sanctions list matching. Attestation required for every load. Approved by CISO office.', intent: 'good' as const },
        ],
        table: {
          columns: ['Dataset', 'Technique', 'Enabled', 'Parameters', 'Approved By'],
          rows: configs.map((c) => [
            c.dataset, c.technique, c.enabled ? 'Yes' : 'No', c.parameters.slice(0, 50), c.approvedBy || '—',
          ]),
        },
      }
    }

    case 'developer-hub': {
      const keys = await db.apiKey.findMany()
      return {
        metrics: [
          { label: 'API keys', value: String(keys.length), trend: 'issued', intent: 'neutral' as const },
          { label: 'Active', value: String(keys.filter((k) => k.status === 'active').length), trend: 'last 24h', intent: 'good' as const },
          { label: 'Webhooks', value: '12', trend: 'configured', intent: 'neutral' as const },
          { label: 'Calls (24h)', value: '1.4M', trend: 'p99 142ms', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Calls by connector (24h)', data: keys.filter((k) => k.status === 'active').map((k) => ({ label: k.name.slice(0, 12), value: Math.floor(Math.random() * 400000) + 50000 })) },
        ],
        highlights: [
          { title: 'Regulation-as-Code SDK', body: 'TypeScript + Python SDKs available. Codify rules as executable: `isCompliantMiFIDII(order)`. v1.4.2 latest.', intent: 'good' as const },
          { title: 'Webhook: real-time alerts', body: 'Subscribe to surveillance alert webhook for sub-1s delivery. Retry with exponential backoff. HMAC-signed payloads.', intent: 'good' as const },
        ],
        table: {
          columns: ['Name', 'Prefix', 'Scopes', 'Rate Limit', 'Status', 'Last Used'],
          rows: keys.map((k) => [
            k.name, k.keyPrefix, k.scopes.slice(0, 30), k.rateLimit + '/min', k.status,
            k.lastUsedAt ? k.lastUsedAt.toISOString().slice(11, 19) + 'Z' : '—',
          ]),
        },
      }
    }

    case 'time-machine': {
      return {
        metrics: [
          { label: 'Snapshots', value: '8,760', trend: 'hourly × 1 yr', intent: 'neutral' as const },
          { label: 'Storage', value: '142 GB', trend: 'compressed', intent: 'good' as const },
          { label: 'Query latency', value: '280ms', trend: 'point-in-time', intent: 'good' as const },
          { label: 'Examinations supported', value: '14', trend: 'this year', intent: 'good' as const },
        ],
        charts: [
          { type: 'line' as const, title: 'Compliance score over 12 months', data: [
            { label: 'Sep', value: 84 }, { label: 'Oct', value: 86 }, { label: 'Nov', value: 85 },
            { label: 'Dec', value: 88 }, { label: 'Jan', value: 87 }, { label: 'Feb', value: 89 },
            { label: 'Mar', value: 91 }, { label: 'Apr', value: 90 }, { label: 'May', value: 92 },
            { label: 'Jun', value: 93 }, { label: 'Jul', value: 92 }, { label: 'Aug', value: 94 },
          ]},
        ],
        highlights: [
          { title: 'Point-in-time query: 14 Aug 2024 15:47 BST', body: 'Returned: 247 active alerts, 12 open cases, 8 policies in draft, overall score 88. Used to defend FCA examination.', intent: 'good' as const },
          { title: 'Diff: policy AML-3.1 → 3.2', body: 'Reconstructed delta between Aug-2024 and Feb-2025 versions. Used to demonstrate consumer duty evolution.', intent: 'good' as const },
        ],
      }
    }

    case 'rule-harmonizer': {
      const comparisons = await db.ruleComparison.findMany()
      return {
        metrics: [
          { label: 'Topics harmonized', value: String(comparisons.length), trend: 'cross-jurisdiction', intent: 'neutral' as const },
          { label: 'Jurisdictions', value: '8', trend: 'US/EU/UK/SG/JP/HK/AU/CA', intent: 'good' as const },
          { label: 'Conflicts surfaced', value: '47', trend: 'auto-detected', intent: 'warn' as const },
          { label: 'Harmonization paths', value: String(comparisons.filter((c) => c.harmonizationPath).length), trend: 'approved', intent: 'good' as const },
        ],
        charts: [
          { type: 'bars' as const, title: 'Conflicts by topic', data: comparisons.map((c) => ({ label: c.topic.slice(0, 14), value: Math.floor(Math.random() * 12) + 3 })) },
        ],
        highlights: [
          { title: 'Derivatives reporting', body: 'US (Dodd-Frank) 59 fields vs EU (EMIR) 60 vs UK (EMIR REFIT) 62 vs SG 63. Harmonization path: map to ISO 20022 TradeLifecycleEvent.', intent: 'warn' as const },
          { title: 'Beneficial ownership thresholds', body: 'US 25%, EU 25% (planned 15%), UK 25%, SG 25% (10% for listed). Operating at 10% globally exceeds all local thresholds.', intent: 'good' as const },
        ],
        table: {
          columns: ['Topic', 'Jurisdictions', 'Differences', 'Harmonization Path'],
          rows: comparisons.map((c) => [
            c.topic, c.jurisdictions, c.differences.slice(0, 60) + '…', (c.harmonizationPath || '—').slice(0, 50),
          ]),
        },
      }
    }

    case 'xcc': {
      const cards = await db.complianceCard.findMany({ take: 25, orderBy: { generatedAt: 'desc' } })
      return {
        metrics: [
          { label: 'Cards generated (24h)', value: String(cards.length * 1247), trend: 'per-decision', intent: 'neutral' as const },
          { label: 'Avg confidence', value: '92%', trend: 'high', intent: 'good' as const },
          { label: 'Declined', value: String(cards.filter((c) => c.decision === 'declined').length), trend: 'blocked', intent: 'bad' as const },
          { label: 'Flagged', value: String(cards.filter((c) => c.decision === 'flagged').length), trend: 'review', intent: 'warn' as const },
        ],
        charts: [
          { type: 'donut' as const, title: 'Decisions', data: [
            { label: 'Approved', value: cards.filter((c) => c.decision === 'approved').length, color: '#10b981' },
            { label: 'Flagged', value: cards.filter((c) => c.decision === 'flagged').length, color: '#f59e0b' },
            { label: 'Declined', value: cards.filter((c) => c.decision === 'declined').length, color: '#ef4444' },
          ]},
          { type: 'bars' as const, title: 'Confidence by decision', data: [
            { label: 'Approved', value: 96 }, { label: 'Flagged', value: 86 }, { label: 'Declined', value: 95 },
          ]},
        ],
        highlights: cards.slice(0, 4).map((c) => ({
          title: `${c.decision.toUpperCase()} — ${c.regulation}`,
          body: `${c.reasoning} (confidence ${c.confidence}%)`,
          intent: c.decision === 'approved' ? 'good' as const : c.decision === 'flagged' ? 'warn' as const : 'bad' as const,
        })),
        table: {
          columns: ['Decision ID', 'Decision', 'Regulation', 'Policy', 'Confidence', 'Evidence'],
          rows: cards.map((c) => [
            c.decisionId, c.decision, c.regulation, c.policyRef, c.confidence + '%', c.evidence.slice(0, 50) + '…',
          ]),
        },
      }
    }

    default:
      return {
        metrics: [
          { label: 'Status', value: 'Preview only', trend: 'static JSON', intent: 'neutral' as const },
          { label: 'Source', value: '/data/', trend: 'bundled', intent: 'good' as const },
        ],
        highlights: [
          {
            title: `View "${viewKey}" runs on bundled static data`,
            body: 'This view is rendered from the JSON files under /public/data/. The dynamic /api/views/* route is only used in dev/standalone server mode.',
            intent: 'neutral' as const,
          },
        ],
      }
  }
}

// ─── helpers ────────────────────────────────────────────────
function channelCounts(alerts: any[]) {
  const m = new Map<string, number>()
  for (const a of alerts) m.set(a.channel, (m.get(a.channel) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function deskCounts(events: any[]) {
  const m = new Map<string, number>()
  for (const e of events) m.set(e.desk, (m.get(e.desk) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function signalTypeCounts(events: any[]) {
  const m = new Map<string, number>()
  for (const e of events) m.set(e.signalType, (m.get(e.signalType) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function listCounts(hits: any[]) {
  const m = new Map<string, number>()
  for (const h of hits) m.set(h.listName, (m.get(h.listName) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function matchTypeCounts(hits: any[]) {
  const m = new Map<string, number>()
  for (const h of hits) m.set(h.matchType, (m.get(h.matchType) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function topCounterparties(alerts: any[]) {
  const m = new Map<string, number>()
  for (const a of alerts) m.set(a.counterparty, (m.get(a.counterparty) || 0) + a.amount)
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }))
}
function agentCounts(runs: any[]) {
  const m = new Map<string, number>()
  for (const r of runs) m.set(r.agentName, (m.get(r.agentName) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function jurisdictionCounts(changes: any[]) {
  const m = new Map<string, number>()
  for (const c of changes) m.set(c.jurisdiction, (m.get(c.jurisdiction) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function attackVectorCounts(tests: any[]) {
  const m = new Map<string, number>()
  for (const t of tests) m.set(t.attackVector, (m.get(t.attackVector) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function caseTypeCounts(cases: any[]) {
  const m = new Map<string, number>()
  for (const c of cases) m.set(c.caseType, (m.get(c.caseType) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function priorityCounts(cases: any[]) {
  const m = new Map<string, number>()
  for (const c of cases) m.set(c.priority, (m.get(c.priority) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function categoryCounts(reports: any[]) {
  const m = new Map<string, number>()
  for (const r of reports) m.set(r.category, (m.get(r.category) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function severityCountsW(reports: any[]) {
  const m = new Map<string, number>()
  for (const r of reports) m.set(r.severity, (m.get(r.severity) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function chainCounts(anchors: any[]) {
  const m = new Map<string, number>()
  for (const a of anchors) m.set(a.chain, (m.get(a.chain) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function anchorTypeCounts(anchors: any[]) {
  const m = new Map<string, number>()
  for (const a of anchors) m.set(a.anchorType, (m.get(a.anchorType) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function digitalEventTypeCounts(events: any[]) {
  const m = new Map<string, number>()
  for (const e of events) m.set(e.eventType, (m.get(e.eventType) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function digitalAssetCounts(events: any[]) {
  const m = new Map<string, number>()
  for (const e of events) m.set(e.asset, (m.get(e.asset) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
function petTechniqueCounts(configs: any[]) {
  const m = new Map<string, number>()
  for (const c of configs) m.set(c.technique, (m.get(c.technique) || 0) + 1)
  return Array.from(m.entries()).map(([label, value]) => ({ label, value }))
}
