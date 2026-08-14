/**
 * Vector Store — Prisma-backed vector storage + retrieval.
 *
 * This is the persistence layer for the RAG pipeline. It manages:
 *   - KnowledgeChunk records (text + sparse vector + metadata)
 *   - CorpusStats singleton (DF table, doc count, avg length)
 *
 * Retrieval strategy:
 *   1. Vectorise the query using current CorpusStats
 *   2. Load candidate chunks (optionally filtered by sourceType/jurisdiction)
 *   3. Compute cosine similarity between query vector and each chunk
 *   4. Return top-K results with scores
 *
 * For Phase 1, candidate loading is "all chunks" — fine for ~10k chunks.
 * For Phase 2+, add an inverted-index model (TermPostings) to prune
 * candidates by shared vocabulary before computing cosine sim.
 */

import { db } from '@/lib/db'
import {
  type SparseVector,
  type CorpusStats as VectorCorpusStats,
  type VectorizedDoc,
  vectorize,
  cosineSimilarity,
  deserialiseVector,
  deserialiseCorpusStats,
  serialiseVector,
  serialiseCorpusStats,
} from './tfidf'
import { tokenize } from './tokenizer'

export type ChunkInput = {
  sourceType: string
  sourceId: string
  title: string
  content: string
  jurisdiction?: string | null
  category?: string | null
  metadata?: Record<string, unknown> | null
}

export type ScoredChunk = {
  id: string
  sourceType: string
  sourceId: string
  title: string
  content: string
  jurisdiction: string | null
  category: string | null
  score: number
  metadata: Record<string, unknown> | null
}

/**
 * Load corpus statistics from the DB. If no stats row exists yet
 * (fresh database), returns an empty stats object.
 */
export async function loadCorpusStats(): Promise<VectorCorpusStats> {
  const row = await db.corpusStats.findUnique({ where: { id: 'corpus' } })
  if (!row) {
    return {
      documentCount: 0,
      docFrequencies: new Map(),
      avgDocLength: 0,
    }
  }
  return deserialiseCorpusStats(row.docFrequencies)
}

/**
 * Persist corpus statistics to the DB.
 */
export async function saveCorpusStats(stats: VectorCorpusStats): Promise<void> {
  await db.corpusStats.upsert({
    where: { id: 'corpus' },
    create: {
      id: 'corpus',
      documentCount: stats.documentCount,
      docFrequencies: serialiseCorpusStats(stats),
      avgDocLength: stats.avgDocLength,
    },
    update: {
      documentCount: stats.documentCount,
      docFrequencies: serialiseCorpusStats(stats),
      avgDocLength: stats.avgDocLength,
    },
  })
}

/**
 * Index a batch of chunks into the vector store.
 *
 * Steps:
 *   1. Tokenise all chunks to build document frequencies
 *   2. Merge with existing corpus DF counts
 *   3. Recompute IDF and vectorise each chunk
 *   4. Upsert KnowledgeChunk records (keyed by sourceType + sourceId + title)
 *   5. Update CorpusStats singleton
 *
 * Idempotency: if the same chunk (same sourceType+sourceId+title) is
 * re-indexed, the existing record is updated with the new vector/content.
 */
export async function indexChunks(inputs: ChunkInput[]): Promise<{
  indexed: number
  skipped: number
}> {
  if (inputs.length === 0) return { indexed: 0, skipped: 0 }

  // 1. Tokenise all chunks
  const tokenised = inputs.map((i) => ({
    input: i,
    tokens: tokenize(`${i.title} ${i.content}`),
  }))

  // 2. Load existing stats + merge
  const existingStats = await loadCorpusStats()
  const mergedDf = new Map(existingStats.docFrequencies)
  for (const { tokens } of tokenised) {
    const unique = new Set(tokens)
    for (const term of unique) {
      mergedDf.set(term, (mergedDf.get(term) ?? 0) + 1)
    }
  }
  const totalDocs = existingStats.documentCount + tokenised.length
  const totalTokens =
    existingStats.avgDocLength * existingStats.documentCount +
    tokenised.reduce((s, t) => s + t.tokens.length, 0)

  const newStats: VectorCorpusStats = {
    documentCount: totalDocs,
    docFrequencies: mergedDf,
    avgDocLength: totalDocs > 0 ? totalTokens / totalDocs : 0,
  }

  // 3. Vectorise each chunk with the NEW stats (so IDF reflects full corpus)
  const vectorised: VectorizedDoc[] = tokenised.map(({ input, tokens }) =>
    vectorize(`${input.title} ${input.content}`, newStats, ''),
  )

  // 4. Upsert chunks. We use sourceType+sourceId+title as a uniqueness key
  //    (Prisma doesn't have composite unique on these, so we look up first).
  let indexed = 0
  let skipped = 0

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const vec = vectorised[i]
    const tokens = tokenised[i].tokens

    const existing = await db.knowledgeChunk.findFirst({
      where: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
      },
      select: { id: true },
    })

    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null

    if (existing) {
      await db.knowledgeChunk.update({
        where: { id: existing.id },
        data: {
          content: input.content,
          jurisdiction: input.jurisdiction ?? null,
          category: input.category ?? null,
          vector: serialiseVector(vec.vector),
          vectorType: 'sparse-tfidf',
          norm: vec.norm,
          tokenCount: tokens.length,
          metadata: metadataJson,
        },
      })
    } else {
      await db.knowledgeChunk.create({
        data: {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          title: input.title,
          content: input.content,
          jurisdiction: input.jurisdiction ?? null,
          category: input.category ?? null,
          vector: serialiseVector(vec.vector),
          vectorType: 'sparse-tfidf',
          norm: vec.norm,
          tokenCount: tokens.length,
          metadata: metadataJson,
        },
      })
    }
    indexed++
  }

  // 5. Save updated corpus stats
  await saveCorpusStats(newStats)

  return { indexed, skipped }
}

/**
 * Retrieve the top-K most similar chunks to a query.
 *
 * @param query - The user's question / search text
 * @param topK  - Number of results to return (default 5)
 * @param filter - Optional filter on sourceType / jurisdiction / category
 */
export async function retrieve(
  query: string,
  topK: number = 5,
  filter?: {
    sourceTypes?: string[]
    jurisdictions?: string[]
    categories?: string[]
  },
): Promise<ScoredChunk[]> {
  const stats = await loadCorpusStats()
  if (stats.documentCount === 0) return []

  // Vectorise the query using current corpus stats
  const queryVec = vectorize(query, stats)

  // Build where clause
  const where: Record<string, unknown> = {}
  if (filter?.sourceTypes && filter.sourceTypes.length > 0) {
    where.sourceType = { in: filter.sourceTypes }
  }
  if (filter?.jurisdictions && filter.jurisdictions.length > 0) {
    where.jurisdiction = { in: filter.jurisdictions }
  }
  if (filter?.categories && filter.categories.length > 0) {
    where.category = { in: filter.categories }
  }

  // Load all candidate chunks. For ~10k chunks this is ~5MB of data — fine.
  // Phase 2: add an inverted index to prune candidates first.
  const chunks = await db.knowledgeChunk.findMany({
    where,
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      title: true,
      content: true,
      jurisdiction: true,
      category: true,
      vector: true,
      metadata: true,
    },
  })

  // Score every chunk
  const scored: ScoredChunk[] = chunks
    .map((chunk) => {
      const chunkVec: SparseVector = deserialiseVector(chunk.vector)
      const score = cosineSimilarity(queryVec.vector, chunkVec)
      return {
        id: chunk.id,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        title: chunk.title,
        content: chunk.content,
        jurisdiction: chunk.jurisdiction,
        category: chunk.category,
        score,
        metadata: chunk.metadata
          ? (JSON.parse(chunk.metadata) as Record<string, unknown>)
          : null,
      }
    })
    .filter((c) => c.score > 0)

  // Sort by score descending, take top K
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

/**
 * Get vector store statistics for monitoring / dashboard display.
 */
export async function getStats(): Promise<{
  totalChunks: number
  bySourceType: Record<string, number>
  byJurisdiction: Record<string, number>
  avgChunkLength: number
}> {
  const total = await db.knowledgeChunk.count()
  if (total === 0) {
    return {
      totalChunks: 0,
      bySourceType: {},
      byJurisdiction: {},
      avgChunkLength: 0,
    }
  }

  const [byTypeRows, byJurRows, avgAgg] = await Promise.all([
    db.knowledgeChunk.groupBy({
      by: ['sourceType'],
      _count: { sourceType: true },
    }),
    db.knowledgeChunk.groupBy({
      by: ['jurisdiction'],
      _count: { jurisdiction: true },
    }),
    db.knowledgeChunk.aggregate({ _avg: { tokenCount: true } }),
  ])

  return {
    totalChunks: total,
    bySourceType: Object.fromEntries(
      byTypeRows.map((r) => [r.sourceType, r._count.sourceType]),
    ),
    byJurisdiction: Object.fromEntries(
      byJurRows
        .filter((r) => r.jurisdiction !== null)
        .map((r) => [r.jurisdiction as string, r._count.jurisdiction]),
    ),
    avgChunkLength: avgAgg._avg.tokenCount ?? 0,
  }
}

/**
 * Wipe all chunks + reset corpus stats. Useful for re-indexing from scratch.
 */
export async function clear(): Promise<void> {
  await db.knowledgeChunk.deleteMany({})
  await db.corpusStats.upsert({
    where: { id: 'corpus' },
    create: {
      id: 'corpus',
      documentCount: 0,
      docFrequencies: '{}',
      avgDocLength: 0,
    },
    update: {
      documentCount: 0,
      docFrequencies: '{}',
      avgDocLength: 0,
    },
  })
}
