'use client'

// src/hooks/use-plugin-data.ts
//
// Unified data-loading hook for plugin views.
//
// Replaces the ad-hoc pattern that ~16 view components used:
//
//   const [data, setData] = useState<T | null>(null)
//   const [loading, setLoading] = useState(true)
//   useEffect(() => {
//     fetch(dataUrl('xxx'))
//       .then(r => r.json())
//       .then(d => setData(d))
//       .finally(() => setLoading(false))
//   }, [])
//
// That pattern had three problems:
//   1. No error handling — if the fetch failed, `data` stayed null and the
//      view silently showed a skeleton forever. The user had no idea why.
//   2. No refetch — once the data loaded, there was no way to retry on
//      failure or refresh after a mutation.
//   3. Inconsistent behavior — every component reinvented the same wheel.
//
// This hook fixes all three: `error` is exposed, `refetch()` is returned,
// and the pattern is defined in one place.
//
// ## The try-API-then-fallback-to-static pattern
//
// `dataUrl(endpoint)` already encodes this:
//   - dev / server mode:    `/api/<endpoint>`     (live data, dynamic slots populated)
//   - static-export mode:   `/data/<endpoint>.json` (snapshot, dynamic slots reserved as null)
//
// The hook just calls `dataUrl(endpoint)`. The "static shell + dynamic slot"
// pattern (see plugins/manifest.json → control-monitor.dynamism and the
// comment block in src/app/api/ccm/route.ts) is automatically honored:
//   - On GitHub Pages (static): UI renders from static JSON, dynamic slots
//     stay null. Graceful degradation by construction.
//   - In dev or on GCP (server): UI renders from API response, dynamic slots
//     are populated by the route handler.
//
// No special "merge" logic is needed in the hook — the route handler is
// responsible for returning the merged payload (static + dynamic slot),
// and the static file ships with the slot reserved as null.

import * as React from 'react'
import { dataUrl } from '@/lib/data'

export interface UsePluginDataOptions<T> {
  /**
   * Transform the raw JSON before storing. Useful for:
   *   - Extracting a sub-field: `d => d.logs ?? []`
   *   - Shaping the response: `d => ({ items: d.records, total: d.count })`
   *
   * If omitted, the raw JSON is stored as-is.
   *
   * NOTE: `select` is NOT in the effect's dependency array by design —
   * if it were, every inline arrow function would trigger a refetch on
   * every render. The function is captured at fetch time, which is fine
   * for our use cases. Pass a `useCallback`-wrapped function if you
   * need it to participate in the dep graph.
   */
  select?: (raw: unknown) => T

  /**
   * Skip the fetch entirely when false. Useful for conditional loads
   * (e.g. only fetch detail data after a row is selected).
   * Default: true.
   */
  enabled?: boolean

  /**
   * Extra dependencies that trigger a refetch when changed.
   * Example: `deps: [selectedId]` to refetch when the selection changes.
   */
  deps?: React.DependencyList
}

export interface UsePluginDataResult<T> {
  /** The loaded data, or null if not yet loaded or load failed. */
  data: T | null
  /** True while the initial fetch is in flight. False after first settle. */
  loading: boolean
  /** Error from the most recent fetch, or null if it succeeded. */
  error: Error | null
  /** Trigger a fresh fetch. Resets `error` and sets `loading: true`. */
  refetch: () => void
}

/**
 * Load plugin data via the unified try-API-then-fallback-to-static pattern.
 *
 * @example
 * // Basic usage — load and store raw JSON
 * const { data, loading } = usePluginData<Metrics>('metrics')
 *
 * @example
 * // With a select transform — extract a sub-field
 * const { data: logs } = usePluginData<AuditLog[]>('audit', {
 *   select: (raw) => (raw as { logs?: AuditLog[] }).logs ?? [],
 * })
 *
 * @example
 * // Conditional load — only fetch when an ID is selected
 * const { data: detail } = usePluginData<Detail>(`items/${selectedId}`, {
 *   enabled: !!selectedId,
 * })
 *
 * @example
 * // Refetch after a mutation
 * const { data, refetch } = usePluginData<Plugins>('plugins')
 * const onToggle = async () => {
 *   await fetch('/api/plugins/foo/toggle', { method: 'POST' })
 *   refetch()
 * }
 */
export function usePluginData<T = unknown>(
  endpoint: string,
  options: UsePluginDataOptions<T> = {},
): UsePluginDataResult<T> {
  const { select, enabled = true, deps = [] } = options

  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState<boolean>(enabled)
  const [error, setError] = React.useState<Error | null>(null)
  const [refetchToken, setRefetchToken] = React.useState(0)

  // Track whether the component is still mounted, so we don't setState
  // after unmount (which would log a warning in dev). React 18 strict mode
  // also double-invokes effects in dev — the `cancelled` flag below handles
  // the "first effect's cleanup runs before second effect's fetch resolves"
  // race.
  const mountedRef = React.useRef(true)
  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = React.useCallback(() => {
    setRefetchToken((t) => t + 1)
  }, [])

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let cancelled = false
    fetch(dataUrl(endpoint))
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(
            `Failed to load ${endpoint}: HTTP ${r.status} ${r.statusText}`,
          )
        }
        return r.json()
      })
      .then((raw: unknown) => {
        if (cancelled) return
        const value = select ? select(raw) : (raw as T)
        setData(value)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (cancelled) return
        if (mountedRef.current) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled, refetchToken, ...deps])

  return { data, loading, error, refetch }
}
