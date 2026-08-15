'use client'

import { cn } from '@/lib/utils'
import type { ViewKey } from '@/app/page'
import { NAV_ZONES } from '@/components/layout/nav-items'

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
            43 state machines · 8 jurisdictions · 16 data models
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
