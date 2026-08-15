'use client'

/**
 * NavContext — provides a `navigate(viewKey)` callback to any component,
 * decoupling the Header (which has the search box) from the page-level
 * state setter in page.tsx.
 *
 * Pattern mirrors home-context.tsx — see that file for design rationale.
 */

import { createContext, useContext } from 'react'
import type { ViewKey } from '@/app/page'

type NavFn = ((view: ViewKey) => void) | null

export const NavContext = createContext<NavFn>(null)

/**
 * Returns the `navigate` callback, or null if we're outside the provider
 * (e.g. in an isolated Storybook story).
 */
export function useNav(): NavFn {
  return useContext(NavContext)
}
