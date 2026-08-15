'use client'

/**
 * CitationList — shared RAG source-citation component.
 *
 * Used by:
 *   - AssistantView (chat provenance)
 *   - Future: CaseManagementView, RegulationsView, etc. when they
 *     consume /api/chat responses
 *
 * Renders a collapsible list of retrieved sources, with:
 *   - Per-source cards (title / snippet / score / sourceType / jurisdiction / category)
 *   - Plugin provenance badges for sources where isPlugin === true
 *     (violet "Plugin: <Name>" label + Puzzle icon + slug badge)
 *   - Optional RetrievalScopeBar showing the active RAG filter
 *     ("Retrieved from N enabled plugins · US, EU · form, label")
 *
 * The shape matches what /api/chat returns in `sources` + `ragFilter`.
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, Puzzle, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Citation = {
  id: string
  sourceType: string
  sourceId?: string | null
  title: string
  jurisdiction?: string | null
  category?: string | null
  score: number
  snippet: string
  isPlugin?: boolean
  pluginSlug?: string | null
}

export type RagFilter = {
  sourceTypes: string[]
  jurisdictions: string[]
  categories: string[]
}

export function CitationList({
  sources,
  ragFilter,
  defaultExpanded = false,
  className,
}: {
  sources: Citation[]
  ragFilter?: RagFilter | null
  defaultExpanded?: boolean
  className?: string
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const pluginSources = sources.filter((s) => s.isPlugin === true)
  const pluginCount = pluginSources.length
  const uniquePlugins = new Set(
    pluginSources.map((s) => s.pluginSlug ?? s.sourceId).filter(Boolean),
  )
  const uniquePluginCount = uniquePlugins.size

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200/60 bg-emerald-50/40 px-3 py-2 text-[11px]',
        className,
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-emerald-800 hover:text-emerald-900"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="h-3 w-3" />
          {sources.length} source{sources.length === 1 ? '' : 's'} retrieved
          {pluginCount > 0 && (
            <Badge
              variant="outline"
              className="ml-1 text-[9px] py-0 h-4 gap-0.5 border-violet-200 bg-violet-50 text-violet-700"
            >
              <Puzzle className="h-2.5 w-2.5" />
              {uniquePluginCount} plugin{uniquePluginCount === 1 ? '' : 's'}
            </Badge>
          )}
        </span>
        <span className="text-[10px] text-emerald-600">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>
      {ragFilter && (
        <RetrievalScopeBar filter={ragFilter} pluginCount={uniquePluginCount} />
      )}
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) => (
            <CitationCard key={s.id || i} source={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Renders the active RAG filter as a compact one-line summary.
 * Example: "Retrieved from: 4 enabled plugins · US, EU · form, label, feature"
 */
export function RetrievalScopeBar({
  filter,
  pluginCount,
}: {
  filter: RagFilter
  pluginCount: number
}) {
  const jurisdictions = filter.jurisdictions.filter((j) => j && j !== 'GLOBAL')
  const hasGlobal = filter.jurisdictions.includes('GLOBAL')
  const jurisdictionLabel = [
    jurisdictions.length > 0 ? jurisdictions.join(', ') : null,
    hasGlobal ? 'GLOBAL' : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-white/70 px-2 py-1 text-[9px] text-slate-600">
      <Filter className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-400" />
      <span className="leading-tight">
        Retrieved from{' '}
        {pluginCount > 0 ? (
          <span className="font-semibold text-violet-700">
            {pluginCount} enabled plugin{pluginCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="font-semibold text-slate-700">baseline corpus</span>
        )}
        {jurisdictionLabel && <span> · {jurisdictionLabel}</span>}
        {filter.categories.length > 0 && (
          <span> · {filter.categories.join(', ')}</span>
        )}
      </span>
    </div>
  )
}

/**
 * Single source citation card. Plugin sources render a prominent
 * violet "Plugin: <Name>" label with a Puzzle icon.
 */
export function CitationCard({
  source,
  index,
}: {
  source: Citation
  index: number
}) {
  const isPlugin = source.isPlugin === true
  const slug = source.pluginSlug ?? (isPlugin ? source.sourceId ?? null : null)

  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-700 truncate flex items-center gap-1.5">
          <span className="text-emerald-600">[{index + 1}]</span>
          {isPlugin ? (
            <span className="flex items-center gap-1">
              <Puzzle className="h-3 w-3 text-violet-600" />
              <span className="text-violet-700">Plugin: {prettyPluginName(slug)}</span>
            </span>
          ) : (
            source.title
          )}
        </span>
        <Badge
          variant="outline"
          className="text-[9px] shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          {(source.score * 100).toFixed(0)}%
        </Badge>
      </div>
      {source.snippet && (
        <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
          {source.snippet}
        </p>
      )}
      <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
        <Badge
          variant="outline"
          className={cn(
            'text-[9px] px-1 py-0 h-3.5',
            isPlugin && 'border-violet-200 bg-violet-50 text-violet-700',
          )}
        >
          {source.sourceType}
        </Badge>
        {source.jurisdiction && <span>· {source.jurisdiction}</span>}
        {source.category && <span>· {source.category}</span>}
        {isPlugin && slug && (
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 h-3.5 ml-auto border-violet-200 bg-violet-50/50 text-violet-600"
          >
            {slug}
          </Badge>
        )}
      </div>
    </div>
  )
}

/**
 * Curated acronym set for regulatory terms.
 * Tokens in this set are uppercased when rendering plugin names.
 */
const PLUGIN_ACRONYMS = new Set([
  'sec', 'finra', 'mifid', 'esma', 'eba', 'eiopa', 'ecb',
  'fca', 'pra', 'mas', 'sfc', 'hkma', 'fsa', 'pmda', 'apra', 'osfi',
  'fatf', 'bis', 'edpb', 'gleif', 'gdpr', 'hipaa', 'aml', 'cft',
  'sar', 'ofac', 'sdn', 'sarbane', 'sox', 'adv', 'u4', 'u5',
  'rt', 'kyc', 'ccpa', 'cpra', 'pipl', 'lgpd', 'dodd', 'frank',
  'basel', 'ifrs', 'gaap', 'soc', 'iso', 'nist', 'csa', 'irac',
  'roca', 'ropa', 'tpr', 'smr', 'cdd', 'edd', 'sdd',
])

/**
 * Convert a plugin slug like "sec-form-adv" into a human-readable label
 * like "SEC Form ADV". Uses a curated acronym list so common regulatory
 * terms are uppercased correctly; everything else is title-cased.
 */
export function prettyPluginName(slug: string | null): string {
  if (!slug) return 'Unknown plugin'
  return slug
    .split('-')
    .map((w) => {
      if (!w) return w
      const lower = w.toLowerCase()
      if (PLUGIN_ACRONYMS.has(lower)) return lower.toUpperCase()
      if (/^\d+$/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}
