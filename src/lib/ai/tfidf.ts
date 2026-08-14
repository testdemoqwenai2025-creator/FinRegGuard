/**
 * TF-IDF Vectorizer — converts text into sparse term-weight vectors.
 *
 * Weights use the standard ltc.ltc scheme:
 *   - l (local): logarithmic TF  -> 1 + log(tf)
 *   - t (global): idf            -> log((N + 1) / (df + 1)) + 1  (smoothed)
 *   - c (normalisation): cosine  -> divide by L2 norm
 *
 * Sparse vectors are stored as Map<term, weight>. Only non-zero terms are
 * kept, so storage is O(vocabulary_size_per_doc) not O(total_vocabulary).
 *
 * Cosine similarity between two sparse vectors is computed by iterating
 * over the smaller map and looking up shared terms in the larger.
 *
 * For Phase 2+, this module can be replaced with a neural embedder
 * (@xenova/transformers or ZAI embeddings) without changing the
 * RetrievalProvider interface in vector-store.ts.
 */

import { tokenize, termFrequencies } from './tokenizer'

export type SparseVector = Map<string, number>

export type VectorizedDoc = {
  /** Document ID (matches KnowledgeChunk.id in the DB) */
  id: string
  /** Sparse TF-IDF vector */
  vector: SparseVector
  /** L2 norm of the vector (precomputed for fast cosine similarity) */
  norm: number
  /** Number of tokens in the original document (for BM25 length normalisation) */
  tokenCount: number
}

export type CorpusStats = {
  /** Total number of documents (N in IDF) */
  documentCount: number
  /** Document frequency per term: how many docs contain each term */
  docFrequencies: Map<string, number>
  /** Average document length in tokens */
  avgDocLength: number
}

/**
 * Build corpus statistics from a collection of token lists.
 * Each entry in `tokenLists` is the tokenised content of one document.
 */
export function buildCorpusStats(tokenLists: string[][]): CorpusStats {
  const docFrequencies = new Map<string, number>()
  let totalTokens = 0

  for (const tokens of tokenLists) {
    totalTokens += tokens.length
    const unique = new Set(tokens)
    for (const term of unique) {
      docFrequencies.set(term, (docFrequencies.get(term) ?? 0) + 1)
    }
  }

  return {
    documentCount: tokenLists.length,
    docFrequencies,
    avgDocLength: tokenLists.length > 0 ? totalTokens / tokenLists.length : 0,
  }
}

/**
 * Compute the IDF (inverse document frequency) for a single term.
 * Uses the smoothed formula: idf = log((N + 1) / (df + 1)) + 1
 * (the +1 smoothing prevents division-by-zero and zero-idf for ubiquitous terms).
 */
export function idf(term: string, stats: CorpusStats): number {
  const df = stats.docFrequencies.get(term) ?? 0
  return Math.log((stats.documentCount + 1) / (df + 1)) + 1
}

/**
 * Vectorize a single document given corpus statistics.
 * Returns a sparse TF-IDF vector + L2 norm.
 */
export function vectorize(
  text: string,
  stats: CorpusStats,
  id: string = '',
): VectorizedDoc {
  const tokens = tokenize(text)
  const tf = termFrequencies(tokens)

  const vector: SparseVector = new Map()
  let sumSquares = 0

  for (const [term, count] of tf) {
    // Logarithmic TF: 1 + log(count)
    const logTf = 1 + Math.log(count)
    const termIdf = idf(term, stats)
    const weight = logTf * termIdf
    vector.set(term, weight)
    sumSquares += weight * weight
  }

  const norm = Math.sqrt(sumSquares)

  // Cosine normalisation: divide each weight by the L2 norm.
  // We do this in-place to avoid a second pass.
  if (norm > 0) {
    for (const [term, weight] of vector) {
      vector.set(term, weight / norm)
    }
  }

  return { id, vector, norm: 1.0, tokenCount: tokens.length }
}

/**
 * Compute cosine similarity between two sparse vectors.
 * Both vectors are assumed to be already L2-normalised (norm = 1),
 * so cosine similarity is just the dot product.
 *
 * Iterates over the smaller vector and looks up shared terms in the larger
 * for O(min(|a|, |b|)) performance.
 */
export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const [small, large] = a.size < b.size ? [a, b] : [b, a]
  let dot = 0
  for (const [term, weight] of small) {
    const other = large.get(term)
    if (other !== undefined) {
      dot += weight * other
    }
  }
  return dot
}

/**
 * Serialise a sparse vector to a JSON string for DB storage.
 */
export function serialiseVector(v: SparseVector): string {
  return JSON.stringify(Object.fromEntries(v))
}

/**
 * Deserialise a sparse vector from a JSON string.
 * Null-safe: handles missing/empty strings.
 */
export function deserialiseVector(s: string | null | undefined): SparseVector {
  if (!s) return new Map()
  try {
    const obj = JSON.parse(s) as Record<string, number> | null
    if (!obj || typeof obj !== 'object') return new Map()
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

/**
 * Serialise corpus statistics to JSON for DB storage.
 */
export function serialiseCorpusStats(stats: CorpusStats): string {
  return JSON.stringify({
    documentCount: stats.documentCount,
    docFrequencies: Object.fromEntries(stats.docFrequencies),
    avgDocLength: stats.avgDocLength,
  })
}

/**
 * Deserialise corpus statistics from JSON.
 * Null-safe: handles missing/empty/malformed strings.
 */
export function deserialiseCorpusStats(s: string | null | undefined): CorpusStats {
  if (!s) {
    return { documentCount: 0, docFrequencies: new Map(), avgDocLength: 0 }
  }
  try {
    const obj = JSON.parse(s) as {
      documentCount?: number
      docFrequencies?: Record<string, number>
      avgDocLength?: number
    } | null
    if (!obj || typeof obj !== 'object') {
      return { documentCount: 0, docFrequencies: new Map(), avgDocLength: 0 }
    }
    return {
      documentCount: obj.documentCount ?? 0,
      docFrequencies: new Map(Object.entries(obj.docFrequencies ?? {})),
      avgDocLength: obj.avgDocLength ?? 0,
    }
  } catch {
    return { documentCount: 0, docFrequencies: new Map(), avgDocLength: 0 }
  }
}
