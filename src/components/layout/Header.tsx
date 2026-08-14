'use client'

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

export function Header() {
  const goHome = useHome()

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

        {/* Search */}
        <div className="relative ml-2 hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search regulations, policies, audit entries..."
            className="h-9 pl-9 bg-muted border-border text-sm"
            aria-label="Global search"
          />
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
