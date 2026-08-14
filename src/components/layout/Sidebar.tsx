'use client'

import {
  LayoutDashboard,
  Gavel,
  FileText,
  History,
  AlertTriangle,
  Bot,
  BarChart3,
  Activity,
  MessageSquareWarning,
  ShieldAlert,
  Network,
  TrendingUp,
  Leaf,
  FlaskConical,
  GitFork,
  Cpu,
  Newspaper,
  Bug,
  Share2,
  FolderKanban,
  Landmark,
  MailWarning,
  Link2,
  Wallet,
  Lock,
  Code2,
  History as TimeHistory,
  Scale,
  FileCheck2,
  Puzzle,
  Store,
  Radio,
  BrainCircuit,
  Globe2,
  HeartHandshake,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewKey } from '@/app/page'

type NavItem = {
  key: ViewKey
  label: string
  icon: LucideIcon
  description: string
}

type NavZone = {
  zone: string
  accent: string
  items: NavItem[]
}

const NAV_ZONES: NavZone[] = [
  {
    zone: 'Core Compliance',
    accent: 'text-emerald-600',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Compliance overview' },
      { key: 'regulations', label: 'Regulations', icon: Gavel, description: 'Multi-jurisdiction tracker' },
      { key: 'policies', label: 'Policies', icon: FileText, description: 'Versioning & AI suggestions' },
      { key: 'audit', label: 'Audit Trail', icon: History, description: 'Immutable activity log' },
      { key: 'risk', label: 'Risk Matrix', icon: AlertTriangle, description: 'Heatmap by business unit' },
      { key: 'assistant', label: 'AI Assistant', icon: Bot, description: 'Compliance copilot' },
      { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Trends & analytics' },
      { key: 'control-monitor', label: 'Control Monitor', icon: Gauge, description: 'Continuous control testing' },
      { key: 'consumer-duty', label: 'Consumer Duty & AI Rights', icon: HeartHandshake, description: 'Consumer Duty + ADM + disclosures' },
    ],
  },
  {
    zone: 'Surveillance',
    accent: 'text-rose-600',
    items: [
      { key: 'transaction-surveillance', label: 'Transaction Surveillance', icon: Activity, description: 'Real-time AML/CFT alerts' },
      { key: 'comms-surveillance', label: 'Comms Surveillance', icon: MessageSquareWarning, description: 'Voice / chat / email NLP' },
      { key: 'sanctions-screening', label: 'Sanctions Screening', icon: ShieldAlert, description: 'OFAC / UN / EU / HMT live' },
      { key: 'network-graph', label: 'Network Graph', icon: Network, description: 'Entity resolution graph' },
      { key: 'adaptive-thresholds', label: 'Adaptive Thresholds', icon: BrainCircuit, description: 'ML anomaly detection' },
    ],
  },
  {
    zone: 'Quant & Computational',
    accent: 'text-violet-600',
    items: [
      { key: 'quant-lab', label: 'Quant Lab', icon: TrendingUp, description: 'Monte Carlo / FRTB / CCAR' },
      { key: 'climate-esg', label: 'Climate & ESG', icon: Leaf, description: 'PCAF / NGFS / Taxonomy' },
      { key: 'counterfactual', label: 'Counterfactual Simulator', icon: FlaskConical, description: 'What-if scenario engine' },
      { key: 'systemic-risk', label: 'Systemic Risk', icon: GitFork, description: 'Contagion & DebtRank' },
    ],
  },
  {
    zone: 'Intelligence & Automation',
    accent: 'text-blue-600',
    items: [
      { key: 'agent-console', label: 'Multi-Agent Console', icon: Cpu, description: 'Agentic AI orchestration' },
      { key: 'regulatory-watch', label: 'Regulatory Watch', icon: Newspaper, description: 'Auto rule change detection' },
      { key: 'red-team', label: 'Red Team Engine', icon: Bug, description: 'Adversarial control testing' },
      { key: 'knowledge-graph', label: 'Knowledge Graph', icon: Share2, description: 'Vector-RAG graph store' },
      { key: 'fairness-testing', label: 'Fairness Testing', icon: Scale, description: 'Algorithmic discrimination' },
    ],
  },
  {
    zone: 'Collaboration & Trust',
    accent: 'text-amber-600',
    items: [
      { key: 'case-management', label: 'Case Management', icon: FolderKanban, description: 'Examination workflows' },
      { key: 'regulator-portal', label: 'Regulator Portal', icon: Landmark, description: 'Examiner read-only mode' },
      { key: 'whistleblower', label: 'Whistleblower', icon: MailWarning, description: 'Encrypted anonymous intake' },
      { key: 'chain-evidence', label: 'Chain Evidence', icon: Link2, description: 'Blockchain-anchored audit' },
      { key: 'digital-assets', label: 'Digital Assets', icon: Wallet, description: 'Travel Rule & on-chain' },
      { key: 'regtech-feeds', label: 'RegTech Feeds', icon: Radio, description: 'FCA / MAS / ESMA APIs' },
    ],
  },
  {
    zone: 'Platform & Governance',
    accent: 'text-slate-600',
    items: [
      { key: 'privacy-pets', label: 'Privacy & PETs', icon: Lock, description: 'Federated / HE / DP / SGX' },
      { key: 'developer-hub', label: 'Developer Hub', icon: Code2, description: 'API keys & webhooks' },
      { key: 'time-machine', label: 'Time Machine', icon: TimeHistory, description: 'Point-in-time queries' },
      { key: 'rule-harmonizer', label: 'Rule Harmonizer', icon: Scale, description: 'Cross-jurisdiction diff' },
      { key: 'xcc', label: 'Compliance Cards', icon: FileCheck2, description: 'Explainable decisions (XCC)' },
      { key: 'plugin-manager', label: 'Plugin Manager', icon: Puzzle, description: 'Toggle forms, labels, features, docs' },
      { key: 'marketplace', label: 'Marketplace', icon: Store, description: 'Install plugins from any URL' },
      { key: 'localization-matrix', label: 'Localization Matrix', icon: Globe2, description: 'Cross-border data flows' },
      { key: 'tia', label: 'Transfer Impact (TIA)', icon: FileCheck2, description: 'Schrems II assessments' },
    ],
  },
]

export function Sidebar({
  current,
  onChange,
}: {
  current: ViewKey
  onChange: (v: ViewKey) => void
}) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-border bg-background lg:block">
      <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAV_ZONES.map((zone) => (
          <div key={zone.zone} className="mb-2">
            <div className={cn('px-3 py-2 text-[10px] font-semibold uppercase tracking-wider', zone.accent)}>
              {zone.zone}
            </div>
            {zone.items.map((item) => {
              const Icon = item.icon
              const active = current === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-all outline-none',
                    'focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                    active
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-100 dark:from-emerald-950/40 dark:to-teal-950/20 dark:text-emerald-300 dark:ring-emerald-900/40'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium leading-tight">{item.label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground/70">{item.description}</span>
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        <div className="mt-auto rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Coverage
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/70">
            36 state machines · 8 jurisdictions · 16 data models
          </p>
        </div>
      </nav>
    </aside>
  )
}

export function MobileNav({
  current,
  onChange,
}: {
  current: ViewKey
  onChange: (v: ViewKey) => void
}) {
  const flat = NAV_ZONES.flatMap((z) => z.items)
  return (
    <div className="lg:hidden border-b border-border bg-background overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {flat.map((item) => {
          const Icon = item.icon
          const active = current === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
