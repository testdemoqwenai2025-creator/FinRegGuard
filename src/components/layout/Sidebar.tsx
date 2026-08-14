'use client'

import {
  LayoutDashboard,
  Gavel,
  FileText,
  History,
  AlertTriangle,
  Bot,
  BarChart3,
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

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Compliance overview' },
  { key: 'regulations', label: 'Regulations', icon: Gavel, description: 'Multi-jurisdiction tracker' },
  { key: 'policies', label: 'Policies', icon: FileText, description: 'Versioning & AI suggestions' },
  { key: 'audit', label: 'Audit Trail', icon: History, description: 'Immutable activity log' },
  { key: 'risk', label: 'Risk Matrix', icon: AlertTriangle, description: 'Heatmap by business unit' },
  { key: 'assistant', label: 'AI Assistant', icon: Bot, description: 'Compliance copilot' },
  { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Trends & analytics' },
]

export function Sidebar({
  current,
  onChange,
}: {
  current: ViewKey
  onChange: (v: ViewKey) => void
}) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Compliance Operations
        </div>
        {NAV.map((item) => {
          const Icon = item.icon
          const active = current === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all outline-none',
                'focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                active
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium leading-tight">{item.label}</span>
                <span className="text-[11px] leading-tight text-slate-400">{item.description}</span>
              </div>
            </button>
          )
        })}

        <div className="mt-auto rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Coverage
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80">
            8 jurisdictions · 12 regulations · 6 policies tracked
          </p>
        </div>
      </nav>
    </aside>
  )
}

// Mobile nav: horizontal pills bar shown below header on small screens.
export function MobileNav({
  current,
  onChange,
}: {
  current: ViewKey
  onChange: (v: ViewKey) => void
}) {
  return (
    <div className="lg:hidden border-b border-slate-200 bg-white overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = current === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50',
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
