'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Shield, Search, Bell, Settings, ChevronDown, LayoutDashboard } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useHome } from '@/lib/home-context'
import { useNav } from '@/lib/nav-context'
import { NAV_ITEMS_FLAT, NAV_ITEM_BY_KEY } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'
import type { ViewKey } from '@/app/page'

type SearchHit = {
  key: ViewKey
  label: string
  description: string
  zone: string
  /** Lowercased haystack used for matching. */
  haystack: string
}

// Pre-compute haystack once at module load — cheaper than recomputing per keystroke.
const SEARCH_HITS: SearchHit[] = NAV_ITEMS_FLAT.map((item) => {
  const zone = NAV_ITEM_BY_KEY[item.key]?.zone ?? ''
  return {
    key: item.key,
    label: item.label,
    description: item.description,
    zone,
    haystack: `${item.label} ${item.description} ${zone} ${item.key}`.toLowerCase(),
  }
})

export function Header() {
  const goHome = useHome()
  const navigate = useNav()

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter nav items by query — match anywhere in label / description / zone / key.
  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    // Score by where the match occurs: label match > description > zone > key.
    const scored: Array<{ hit: SearchHit; score: number }> = []
    for (const hit of SEARCH_HITS) {
      const idx = hit.haystack.indexOf(q)
      if (idx === -1) continue
      let score = 100
      if (hit.label.toLowerCase().includes(q)) score += 50
      if (hit.zone.toLowerCase().includes(q)) score += 20
      if (hit.description.toLowerCase().includes(q)) score += 10
      score -= idx // earlier matches rank higher
      scored.push({ hit, score })
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 8).map((s) => s.hit)
  }, [query])

  // Reset active index whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0)
  }, [results])

  // Open the dropdown whenever there's a non-empty query and at least one hit.
  useEffect(() => {
    setIsOpen(results.length > 0)
  }, [results])

  // Close dropdown on outside click.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  // Global keyboard shortcut: "/" focuses the search input (unless user is
  // already typing in another input/textarea).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function pick(hit: SearchHit) {
    if (!navigate) return
    navigate(hit.key)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) setIsOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) pick(results[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-2 sm:gap-4 px-4 sm:px-6">
        {/* Brand — clicking the brand also returns home */}
        <button
          type="button"
          onClick={() => goHome?.()}
          disabled={!goHome}
          className="flex items-center gap-2.5 rounded-md outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-default"
          aria-label="Return to dashboard"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <Shield className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight text-left">
            <span className="text-base font-bold text-foreground">RegGuard AI</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              Compliance Automator
            </span>
          </div>
        </button>

        {/* Back to Dashboard button — visible on every page except the dashboard itself.
            On mobile it's icon-only; on sm+ it shows the label too. */}
        {goHome && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => goHome()}
            className="ml-1 inline-flex gap-1.5 border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back to Dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-medium">Dashboard</span>
          </Button>
        )}

        {/* Search — command-palette style. Filters all 45 nav items by label / description / zone. */}
        <div ref={containerRef} className="relative ml-2 hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true) }}
            onKeyDown={onKeyDown}
            placeholder="Search views…  (press / to focus)"
            className="h-9 pl-9 bg-muted border-border text-sm"
            aria-label="Global search"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="search-results"
            role="combobox"
          />
          {isOpen && results.length > 0 && (
            <div
              id="search-results"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-background shadow-lg ring-1 ring-black/5"
            >
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
                {results.length} result{results.length === 1 ? '' : 's'} · ↑↓ to navigate · ↵ to open · Esc to close
              </div>
              {results.map((hit, i) => {
                const active = i === activeIndex
                return (
                  <button
                    key={hit.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(hit)}
                    className={cn(
                      'flex w-full items-start gap-3 px-3 py-2 text-left transition-colors',
                      active ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-muted',
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{hit.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                          {hit.zone}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{hit.description}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-50"
          >
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </Badge>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-[10px]">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">SEC Rule 15c2-11</span>
                  <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                </div>
                <p className="text-xs text-slate-500">Effective in 38 days — Capital Markets not yet ready</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">HIPAA Policy Overdue</span>
                  <Badge variant="secondary" className="text-[10px]">Warning</Badge>
                </div>
                <p className="text-xs text-slate-500">5 days past review date — escalate to CCO</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">Basel III Risk Escalated</span>
                  <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                </div>
                <p className="text-xs text-slate-500">Residual risk exceeds tolerance — Group Risk notified</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted transition-colors outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold">
                  SC
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-foreground">Sarah Chen</span>
                <span className="text-[10px] text-muted-foreground">Chief Compliance Officer</span>
              </div>
              <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Sarah Chen</span>
                  <span className="text-xs font-normal text-slate-500">sarah.chen@regco.io</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>My Tasks (12)</DropdownMenuItem>
              <DropdownMenuItem>Sign-off Queue</DropdownMenuItem>
              {goHome && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => goHome()} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Back to Dashboard
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
