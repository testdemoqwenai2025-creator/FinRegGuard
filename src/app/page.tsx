'use client'

import { useState, useCallback } from 'react'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { HomeContext } from '@/lib/home-context'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { RegulationsView } from '@/components/regulations/RegulationsView'
import { PoliciesView } from '@/components/policies/PoliciesView'
import { AuditView } from '@/components/audit/AuditView'
import { RiskView } from '@/components/risk/RiskView'
import { AssistantView } from '@/components/assistant/AssistantView'
import { ReportsView } from '@/components/reports/ReportsView'
import { ControlMonitorView } from '@/components/compliance/ControlMonitorView'
import { ConsumerDutyView } from '@/components/consumer-duty/ConsumerDutyView'
// ─── Surveillance Zone ───
import { TransactionSurveillanceView } from '@/components/surveillance/TransactionSurveillanceView'
import { CommsSurveillanceView } from '@/components/surveillance/CommsSurveillanceView'
import { SanctionsScreeningView } from '@/components/surveillance/SanctionsScreeningView'
import { NetworkGraphExplorerView } from '@/components/surveillance/NetworkGraphExplorerView'
import { AdaptiveThresholdsView } from '@/components/surveillance/AdaptiveThresholdsView'
import { TmAlertTaxonomyView } from '@/components/surveillance/TmAlertTaxonomyView'
// ─── Quant & Computational Zone ───
import { QuantLabView } from '@/components/quant/QuantLabView'
import { ClimateEsgView } from '@/components/quant/ClimateEsgView'
import { CounterfactualView } from '@/components/quant/CounterfactualView'
import { SystemicRiskView } from '@/components/quant/SystemicRiskView'
import { EsgReportingView } from '@/components/quant/EsgReportingView'
// ─── Intelligence & Automation Zone ───
import { AgentConsoleView } from '@/components/intelligence/AgentConsoleView'
import { RegulatoryWatchView } from '@/components/intelligence/RegulatoryWatchView'
import { RedTeamView } from '@/components/intelligence/RedTeamView'
import { KnowledgeGraphView } from '@/components/intelligence/KnowledgeGraphView'
import { FairnessTestingView } from '@/components/intelligence/FairnessTestingView'
import { ReportingEvolutionView } from '@/components/intelligence/ReportingEvolutionView'
import { AiModelRiskView } from '@/components/intelligence/AiModelRiskView'
import { AiGovernanceView } from '@/components/intelligence/AiGovernanceView'
// ─── Collaboration & Trust Zone ───
import { CaseManagementView } from '@/components/collaboration/CaseManagementView'
import { RegulatorPortalView } from '@/components/collaboration/RegulatorPortalView'
import { WhistleblowerView } from '@/components/collaboration/WhistleblowerView'
import { ChainEvidenceView } from '@/components/collaboration/ChainEvidenceView'
import { DigitalAssetsView } from '@/components/collaboration/DigitalAssetsView'
import { RegtechFeedsView } from '@/components/collaboration/RegtechFeedsView'
import { CryptoRegulationView } from '@/components/collaboration/CryptoRegulationView'
// ─── Platform & Governance Zone ───
import { PrivacyPetsView } from '@/components/platform/PrivacyPetsView'
import { DeveloperHubView } from '@/components/platform/DeveloperHubView'
import { TimeMachineView } from '@/components/platform/TimeMachineView'
import { RuleHarmonizerView } from '@/components/platform/RuleHarmonizerView'
import { XccView } from '@/components/platform/XccView'
import { PluginManagerView } from '@/components/platform/PluginManagerView'
import { MarketplaceView } from '@/components/platform/MarketplaceView'
import { LocalizationMatrixView } from '@/components/platform/LocalizationMatrixView'
import { TiaView } from '@/components/platform/TiaView'
import { DataSensitivityView } from '@/components/platform/DataSensitivityView'
// ─── Forms (Phase 1 Commit 2 — L5/L6/L7 Auto-Fill) ───
import { FormInstanceView } from '@/components/forms/FormInstanceView'
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
  | 'control-monitor'
  | 'consumer-duty'
  | 'form-instance'
  // Surveillance Zone
  | 'transaction-surveillance'
  | 'comms-surveillance'
  | 'sanctions-screening'
  | 'network-graph'
  | 'adaptive-thresholds'
  // Quant & Computational Zone
  | 'quant-lab'
  | 'climate-esg'
  | 'counterfactual'
  | 'systemic-risk'
  | 'esg-reporting'
  // Intelligence & Automation Zone
  | 'agent-console'
  | 'regulatory-watch'
  | 'red-team'
  | 'knowledge-graph'
  | 'fairness-testing'
  | 'reporting-evolution'
  | 'ai-model-risk'
  | 'ai-governance'
  | 'tm-alert-taxonomy'
  // Collaboration & Trust Zone
  | 'case-management'
  | 'regulator-portal'
  | 'whistleblower'
  | 'chain-evidence'
  | 'digital-assets'
  | 'regtech-feeds'
  | 'crypto-regulation'
  // Platform & Governance Zone
  | 'privacy-pets'
  | 'developer-hub'
  | 'time-machine'
  | 'rule-harmonizer'
  | 'xcc'
  | 'plugin-manager'
  | 'marketplace'
  | 'localization-matrix'
  | 'tia'
  | 'data-sensitivity'

export default function Home() {
  const [view, setView] = useState<ViewKey>('dashboard')

  // Always call useCallback unconditionally (Rules of Hooks).
  // goHome is null when we're already on the dashboard — this lets Header,
  // PageHeader, and any consumer hide their "Back to Dashboard" button.
  const goToDashboard = useCallback(() => setView('dashboard'), [])
  const goHome = view === 'dashboard' ? null : goToDashboard

  const render = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />
      case 'regulations': return <RegulationsView />
      case 'policies': return <PoliciesView />
      case 'audit': return <AuditView />
      case 'risk': return <RiskView />
      case 'assistant': return <AssistantView />
      case 'reports': return <ReportsView />
      case 'control-monitor': return <ControlMonitorView />
      case 'consumer-duty': return <ConsumerDutyView />
      case 'form-instance': return <FormInstanceView />

      // ─── Surveillance ───
      case 'transaction-surveillance': return <TransactionSurveillanceView />
      case 'comms-surveillance': return <CommsSurveillanceView />
      case 'sanctions-screening': return <SanctionsScreeningView />
      case 'network-graph': return <NetworkGraphExplorerView />
      case 'adaptive-thresholds': return <AdaptiveThresholdsView />
      case 'tm-alert-taxonomy': return <TmAlertTaxonomyView />

      // ─── Quant & Computational ───
      case 'quant-lab': return <QuantLabView />
      case 'climate-esg': return <ClimateEsgView />
      case 'counterfactual': return <CounterfactualView />
      case 'systemic-risk': return <SystemicRiskView />
      case 'esg-reporting': return <EsgReportingView />

      // ─── Intelligence & Automation ───
      case 'agent-console': return <AgentConsoleView />
      case 'regulatory-watch': return <RegulatoryWatchView />
      case 'red-team': return <RedTeamView />
      case 'knowledge-graph': return <KnowledgeGraphView />
      case 'fairness-testing': return <FairnessTestingView />
      case 'reporting-evolution': return <ReportingEvolutionView />
      case 'ai-model-risk': return <AiModelRiskView />
      case 'ai-governance': return <AiGovernanceView />

      // ─── Collaboration & Trust ───
      case 'case-management': return <CaseManagementView />
      case 'regulator-portal': return <RegulatorPortalView />
      case 'whistleblower': return <WhistleblowerView />
      case 'chain-evidence': return <ChainEvidenceView />
      case 'digital-assets': return <DigitalAssetsView />
      case 'regtech-feeds': return <RegtechFeedsView />
      case 'crypto-regulation': return <CryptoRegulationView />

      // ─── Platform & Governance ───
      case 'privacy-pets': return <PrivacyPetsView />
      case 'developer-hub': return <DeveloperHubView />
      case 'time-machine': return <TimeMachineView />
      case 'rule-harmonizer': return <RuleHarmonizerView />
      case 'xcc': return <XccView />
      case 'plugin-manager': return <PluginManagerView />
      case 'marketplace': return <MarketplaceView />
      case 'localization-matrix': return <LocalizationMatrixView />
      case 'tia': return <TiaView />
      case 'data-sensitivity': return <DataSensitivityView />

      default: return <DashboardView />
    }
  }

  return (
    <HomeContext.Provider value={goHome}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex flex-1 w-full flex-col lg:flex-row">
          <MobileNav current={view} onChange={setView} />
          <Sidebar current={view} onChange={setView} />
          <main className="flex-1 min-w-0 overflow-x-hidden">
            {render()}
          </main>
        </div>
        <footer className="mt-auto border-t border-border bg-background px-6 py-4 text-xs text-muted-foreground">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong className="text-foreground">RegGuard AI</strong> · AI Regulatory Compliance
                Automator
              </span>
              <span className="hidden sm:inline text-muted-foreground/60">·</span>
              <span className="hidden sm:inline">43 state machines · 6 zones · machine proposes, human confirms</span>
              <span className="hidden sm:inline text-muted-foreground/60">·</span>
              <span className="hidden sm:inline">45 views · Plugin Registry + Marketplace live</span>
            </div>
            <div className="flex items-center gap-4">
              <span>v2.1.0 · build {new Date().getFullYear()}.08</span>
              <a
                href="https://github.com/testdemoqwenai2025-creator/FinRegGTP.BoT"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </HomeContext.Provider>
  )
}
