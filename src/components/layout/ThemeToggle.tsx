'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * ThemeToggle — a small dropdown that lets the user switch between
 * light, dark, and system themes. Uses next-themes for persistence.
 *
 * Render-safe: renders a placeholder button until mounted to avoid
 * hydration mismatch (theme is only known on the client).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes reads from localStorage / system pref on the client only.
  // We render a stable placeholder until mounted so SSR + first paint match.
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors outline-none"
        aria-label="Toggle theme"
      >
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && <span className="ml-auto text-xs text-emerald-600">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && <span className="ml-auto text-xs text-emerald-600">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="gap-2 cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && <span className="ml-auto text-xs text-emerald-600">●</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
