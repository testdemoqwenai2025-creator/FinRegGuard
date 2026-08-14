'use client'

import { useState } from 'react'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { RegulationsView } from '@/components/regulations/RegulationsView'
import { PoliciesView } from '@/components/policies/PoliciesView'
import { AuditView } from '@/components/audit/AuditView'
import { RiskView } from '@/components/risk/RiskView'
import { AssistantView } from '@/components/assistant/AssistantView'
import { ReportsView } from '@/components/reports/ReportsView'
import { ViewShell } from '@/components/shared/ViewShell'
import { Scale, Github, Linkedin } from 'lucide-react'

export type ViewKey =
  // Core Compliance Zone
  | 'dashboard'
  | 'regulations'
  | 'policies'
  | 'audit'
  | 'risk'
  | 'assistant'
  | 'reports'
  // Surveillance Zone
  | 'transaction-surveillance'
  | 'comms-surveillance'
  | 'sanctions-screening'
  | 'network-graph'
  // Quant & Computational Zone
  | 'quant-lab'
  | 'climate-esg'
  | 'counterfactual'
  | 'systemic-risk'
  // Intelligence & Automation Zone
  | 'agent-console'
  | 'regulatory-watch'
  | 'red-team'
  | 'knowledge-graph'
  // Collaboration & Trust Zone
  | 'case-management'
  | 'regulator-portal'
  | 'whistleblower'
  | 'chain-evidence'
  | 'digital-assets'
  // Platform & Governance Zone
  | 'privacy-pets'
  | 'developer-hub'
  | 'time-machine'
  | 'rule-harmonizer'
  | 'xcc'

export default function Home() {
  const [view, setView] = useState<ViewKey>('dashboard')

  const render = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />
      case 'regulations': return <RegulationsView />
      case 'policies': return <PoliciesView />
      case 'audit': return <AuditView />
      case 'risk': return <RiskView />
      case 'assistant': return <AssistantView />
      case 'reports': return <ReportsView />

      // ─── Surveillance ───
      case 'transaction-surveillance':
        return <ViewShell zone="Surveillance" title="Transaction Surveillance" subtitle="Real-time AML/CFT alert monitoring with sub-second decisioning on SWIFT, SEPA, RTP and crypto rails." viewKey={view} />
      case 'comms-surveillance':
        return <ViewShell zone="Surveillance" title="Communications Surveillance" subtitle="NLP-driven surveillance of voice, email, Bloomberg chat and mobile — detecting market abuse, collusion and off-channel activity per MiFID II Article 16." viewKey={view} />
      case 'sanctions-screening':
        return <ViewShell zone="Surveillance" title="Sanctions Screening" subtitle="Real-time OFAC, UN, EU, HMT, MAS list screening with fuzzy / phonetic / exact match scoring." viewKey={view} />
      case 'network-graph':
        return <ViewShell zone="Surveillance" title="Entity Network Explorer" subtitle="Force-directed graph of counterparties, beneficial owners and fund flows — turning money laundering from a row problem into a graph problem." viewKey={view} />

      // ─── Quant & Computational ───
      case 'quant-lab':
        return <ViewShell zone="Quant & Computational" title="Quant Lab" subtitle="Monte Carlo capital adequacy, FRTB IMA, CCAR/EBA/BoE stress testing with 10,000+ scenario paths." viewKey={view} />
      case 'climate-esg':
        return <ViewShell zone="Quant & Computational" title="Climate & ESG Risk" subtitle="PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios and TNFD nature-related financial risk." viewKey={view} />
      case 'counterfactual':
        return <ViewShell zone="Quant & Computational" title="Counterfactual Simulator" subtitle="What-if engine: regress the entire compliance + risk posture against hypothetical futures (rate hikes, MiFID III passage, sovereign default)." viewKey={view} />
      case 'systemic-risk':
        return <ViewShell zone="Quant & Computational" title="Systemic Risk & Contagion" subtitle="DebtRank and interbank exposure graphs — model cascading failures and central-clearing chokepoints." viewKey={view} />

      // ─── Intelligence & Automation ───
      case 'agent-console':
        return <ViewShell zone="Intelligence & Automation" title="Multi-Agent Console" subtitle="Orchestration of regulatory watcher, policy drafter, control tester and regulator liaison agents — with human-in-the-loop approval gates." viewKey={view} />
      case 'regulatory-watch':
        return <ViewShell zone="Intelligence & Automation" title="Regulatory Watch" subtitle="Automated parsing of Federal Register, ESMA, FCA, MAS, FSB publications — classified, scored, and triaged by AI." viewKey={view} />
      case 'red-team':
        return <ViewShell zone="Intelligence & Automation" title="Red Team Engine" subtitle="Adversarial agent that continuously attacks your own controls — simulating structuring, sanctions evasion, prompt injection and insider trading." viewKey={view} />
      case 'knowledge-graph':
        return <ViewShell zone="Intelligence & Automation" title="Regulatory Knowledge Graph" subtitle="Regulation → policy → control → evidence as a navigable semantic graph with vector RAG retrieval." viewKey={view} />

      // ─── Collaboration & Trust ───
      case 'case-management':
        return <ViewShell zone="Collaboration & Trust" title="Case Management" subtitle="Examination, investigation and regulator-request workflows with SLA tracking and evidence packaging." viewKey={view} />
      case 'regulator-portal':
        return <ViewShell zone="Collaboration & Trust" title="Regulator Portal" subtitle="Read-only, scoped examiner view — they see what they're entitled to, every query they make is itself logged." viewKey={view} />
      case 'whistleblower':
        return <ViewShell zone="Collaboration & Trust" title="Whistleblower Channel" subtitle="End-to-end encrypted anonymous intake with LLM triage. Catches problems before regulators do." viewKey={view} />
      case 'chain-evidence':
        return <ViewShell zone="Collaboration & Trust" title="Chain Evidence" subtitle="Every audit log entry hashed and anchored to Hyperledger Besu / Ethereum Sepia — cryptographic tamper detection." viewKey={view} />
      case 'digital-assets':
        return <ViewShell zone="Collaboration & Trust" title="Digital Asset Compliance" subtitle="FATF Travel Rule, on-chain sanctions screening, mixer detection and CBDC compliance for crypto flows." viewKey={view} />

      // ─── Platform & Governance ───
      case 'privacy-pets':
        return <ViewShell zone="Platform & Governance" title="Privacy & PETs Console" subtitle="Federated learning, homomorphic encryption, differential privacy and secure enclaves — toggle per dataset." viewKey={view} />
      case 'developer-hub':
        return <ViewShell zone="Platform & Governance" title="Developer Hub" subtitle="REST + GraphQL API keys, webhooks, SDK docs and sandbox — embed compliance into business apps." viewKey={view} />
      case 'time-machine':
        return <ViewShell zone="Platform & Governance" title="Regulatory Time Machine" subtitle="Point-in-time queries: 'What was our compliance posture on 14 Aug 2024 at 3:47pm?' — instantly defensible for examinations." viewKey={view} />
      case 'rule-harmonizer':
        return <ViewShell zone="Platform & Governance" title="Cross-Jurisdiction Rule Harmonizer" subtitle="Visual diff engine across US / EU / UK / APAC rules — operate one global program with local variations." viewKey={view} />
      case 'xcc':
        return <ViewShell zone="Platform & Governance" title="Explainable Compliance Cards" subtitle="Every approve / flag / decline decision ships with a one-page cited explanation — defensible in court, mandated by EU AI Act Art 13." viewKey={view} />

      default: return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="flex flex-1 w-full flex-col lg:flex-row">
        <MobileNav current={view} onChange={setView} />
        <Sidebar current={view} onChange={setView} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {render()}
        </main>
      </div>
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-600" />
            <span>
              <strong className="text-slate-700">RegGuard AI</strong> · AI Regulatory Compliance
              Automator
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline">29 state machines · 6 zones · TAM $55B regtech by 2027</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v2.0.0 · build {new Date().getFullYear()}.08</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
