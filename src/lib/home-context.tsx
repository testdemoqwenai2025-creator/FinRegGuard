'use client'

/**
 * HomeContext — provides a "go home" (return to dashboard) callback
 * to any view or layout component, without prop-drilling through every
 * page header.
 *
 * Usage in page.tsx:
 *   <HomeContext.Provider value={() => setView('dashboard')}>
 *     <Header />
 *     <Sidebar />
 *     <SomeView />
 *   </HomeContext.Provider>
 *
 * Usage in a view:
 *   const goHome = useHome()
 *   if (goHome) { show a back button (we are NOT on the dashboard) }
 */

import { createContext, useContext } from 'react'

type HomeFn = (() => void) | null

export const HomeContext = createContext<HomeFn>(null)

/**
 * Returns the "go home" callback if one is in scope, OR null if we're
 * already on the dashboard (so the back button can be hidden).
 */
export function useHome(): HomeFn {
  return useContext(HomeContext)
}
