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
  Radar,
  ShieldCheck,
  Database,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import type { ViewKey } from '@/app/page'

export type NavItem = {
  key: ViewKey
  label: string
  icon: LucideIcon
  description: string
}

export type NavZone = {
  zone: string
  accent: string
  items: NavItem[]
}

export const NAV_ZONES: NavZone[] = [
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
      { key: 'form-instance', label: 'Form Auto-Fill', icon: FileCheck2, description: 'L5/L6/L7 orchestrator + provenance' },
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
      { key: 'tm-alert-taxonomy', label: 'TM Alert Taxonomy', icon: Radar, description: '20-category FATF typology' },
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
      { key: 'esg-reporting', label: 'ESG Reporting', icon: Leaf, description: 'ISSB / ESRS / SEC + NGFS scenarios' },
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
      { key: 'reporting-evolution', label: 'Reporting Evolution', icon: TrendingUp, description: 'Paper to streaming (2010-2030)' },
      { key: 'ai-model-risk', label: 'AI/ML Model Risk Tiers', icon: BrainCircuit, description: 'SR 11-7 tiered governance' },
      { key: 'ai-governance', label: 'AI/ML Governance', icon: Layers, description: 'Lifecycle + XAI + fairness matrix' },
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
      { key: 'crypto-regulation', label: 'Crypto Regulation', icon: Landmark, description: 'MiCA + Travel Rule + DeFi' },
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
      { key: 'data-sensitivity', label: 'Data Sensitivity', icon: ShieldCheck, description: 'GDPR/PIPL tier controls' },
    ],
  },
]

/** Flat list of all nav items — useful for global search. */
export const NAV_ITEMS_FLAT: NavItem[] = NAV_ZONES.flatMap((z) => z.items)

/** Map ViewKey → NavItem (for reverse lookup). */
export const NAV_ITEM_BY_KEY: Record<string, NavItem & { zone: string }> = Object.fromEntries(
  NAV_ZONES.flatMap((z) => z.items.map((i) => [i.key, { ...i, zone: z.zone }])),
)
