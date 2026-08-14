// Shared TypeScript types for the AI Regulatory Compliance Automator.
// These mirror the Prisma models but are safe to import on the client.

export type Regulation = {
  id: string
  title: string
  jurisdiction: string
  regulator: string
  category: string
  status: 'monitoring' | 'pending' | 'effective' | 'superseded'
  effectiveDate: string
  summary: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  affectedUnits: string
  createdAt: string
  updatedAt: string
}

export type Policy = {
  id: string
  title: string
  category: string
  ownerUnit: string
  version: string
  status: 'draft' | 'review' | 'approved' | 'published' | 'retired'
  reviewDate: string
  content: string
  aiSuggestion: string | null
  lastUpdated: string
  createdAt: string
}

export type AuditLog = {
  id: string
  actor: string
  action: string
  targetType: string
  targetId: string
  description: string
  ipAddress: string | null
  severity: 'info' | 'warning' | 'critical'
  timestamp: string
}

export type RiskItem = {
  id: string
  businessUnit: string
  regulationArea: string
  likelihood: number
  impact: number
  inherentRisk: number
  residualRisk: number
  trend: 'improving' | 'stable' | 'worsening'
  owner: string
  mitigationPlan: string
  createdAt: string
  updatedAt: string
}

export type ComplianceMetric = {
  id: string
  snapshotDate: string
  overallScore: number
  openFindings: number
  overdueTasks: number
  policiesCurrent: number
  trainingComplete: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  context: string | null
  createdAt: string
}

export type DashboardData = {
  latest: ComplianceMetric | null
  previous: ComplianceMetric | null
  history: ComplianceMetric[]
  counts: { regulations: number; policies: number; auditLogs: number; riskItems: number }
  kpis: { pendingRegulations: number; criticalRisks: number; overduePolicies: number }
}

export type RiskUnitSummary = {
  unit: string
  avgResidual: number
  maxInherent: number
  count: number
}
