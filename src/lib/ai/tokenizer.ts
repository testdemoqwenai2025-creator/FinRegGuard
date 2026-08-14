/**
 * Tokenizer — converts text into normalized term tokens.
 *
 * Pipeline:
 *   1. Lowercase
 *   2. Strip punctuation (keep alphanumerics + hyphens)
 *   3. Split on whitespace
 *   4. Remove stopwords
 *   5. Apply a lightweight stemmer (Porter-like — handles common suffixes)
 *
 * Designed for regulatory/policy text where keyword density matters more
 * than morphological precision. For neural embeddings (Phase 2+), this
 * tokenizer is bypassed entirely.
 */

const STOPWORDS = new Set([
  // English articles / prepositions / conjunctions
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'for',
  'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'into',
  'about', 'above', 'below', 'between', 'through', 'during', 'before',
  'after', 'up', 'down', 'over', 'under', 'again', 'further',
  // Pronouns
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that',
  'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
  // Auxiliaries
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'can', 'shall', 'need',
  // Common regulatory filler words (low discriminative value)
  'shall', 'may', 'must', 'should', 'would', 'could',
  // Trivially short tokens
  's', 't', 'd', 'll', 're', 've', 'm',
])

/**
 * Apply a Porter-light stemmer — strips the most common English suffixes
 * to collapse morphological variants (e.g. "regulations" -> "regul",
 * "compliance" -> "compli"). This is intentionally crude; for production
 * RAG you'd swap in @xenova/transformers or a Snowball stemmer.
 */
function stem(word: string): string {
  if (word.length <= 3) return word

  let w = word
  w = w.replace(/(ization|isations?)$/, 'iz')
  w = w.replace(/ational$/, 'ate')
  w = w.replace(/fulness$/, 'ful')
  w = w.replace(/ousness$/, 'ous')
  w = w.replace(/iveness$/, 'ive')
  w = w.replace(/ements?$/, 'e')
  if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3)
  if (w.length > 3 && w.endsWith('ies')) w = w.slice(0, -3) + 'y'
  if (w.length > 3 && w.endsWith('ied')) w = w.slice(0, -3) + 'y'
  if (w.endsWith('sses')) w = w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (w.length > 4 && w.endsWith('ly')) w = w.slice(0, -2)
  if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2)

  return w
}

/**
 * Tokenize a string into normalized terms.
 * Returns an array of stemmed tokens (with duplicates - caller can count).
 */
export function tokenize(text: string): string[] {
  if (!text) return []

  const lower = text.toLowerCase()

  const cleaned = lower
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return []

  const tokens: string[] = []
  for (const raw of cleaned.split(/[\s/]+/)) {
    if (!raw || raw.length < 2) continue
    if (STOPWORDS.has(raw)) continue
    if (/^\d+$/.test(raw)) {
      tokens.push(raw)
      continue
    }
    const stemmed = stem(raw)
    if (stemmed.length < 2) continue
    if (STOPWORDS.has(stemmed)) continue
    tokens.push(stemmed)
  }

  return tokens
}

/**
 * Build a term-frequency map from a token list.
 */
export function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1)
  }
  return tf
}
