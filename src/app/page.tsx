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
import { Scale, Github, Linkedin } from 'lucide-react'

export type ViewKey =
  | 'dashboard'
  | 'regulations'
  | 'policies'
  | 'audit'
  | 'risk'
  | 'assistant'
  | 'reports'

export default function Home() {
  const [view, setView] = useState<ViewKey>('dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="flex flex-1 w-full flex-col lg:flex-row">
        <MobileNav current={view} onChange={setView} />
        <Sidebar current={view} onChange={setView} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {view === 'dashboard' && <DashboardView />}
          {view === 'regulations' && <RegulationsView />}
          {view === 'policies' && <PoliciesView />}
          {view === 'audit' && <AuditView />}
          {view === 'risk' && <RiskView />}
          {view === 'assistant' && <AssistantView />}
          {view === 'reports' && <ReportsView />}
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
            <span className="hidden sm:inline">TAM $55B regtech by 2027</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v1.0.0 · build {new Date().getFullYear()}.08</span>
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
