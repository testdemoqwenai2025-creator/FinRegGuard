/**
 * Text Chunker — splits long documents into retrieval-friendly chunks.
 *
 * Strategy:
 *   1. Split on double-newlines (paragraph boundaries)
 *   2. For each paragraph, if it exceeds maxChunkChars, split on single newlines
 *   3. For each piece, if still too long, split on sentence boundaries
 *   4. Merge consecutive small pieces back together up to maxChunkChars
 *
 * Each chunk has up to `overlapChars` of overlap with the previous chunk
 * to preserve context across boundaries (improves retrieval continuity).
 *
 * Default target: 500 chars per chunk with 80 char overlap — works well
 * for regulatory text where paragraphs are typically 200-800 chars.
 */

export type Chunk = {
  text: string
  /** 0-indexed position in the original document */
  index: number
}

const DEFAULT_MAX = 500
const DEFAULT_OVERLAP = 80

/**
 * Split text into chunks of approximately `maxChunkChars` with `overlapChars`
 * of overlap between consecutive chunks.
 */
export function chunkText(
  text: string,
  maxChunkChars: number = DEFAULT_MAX,
  overlapChars: number = DEFAULT_OVERLAP,
): Chunk[] {
  if (!text || text.trim().length === 0) return []

  // Normalise whitespace but preserve paragraph breaks
  const normalised = text.replace(/\r\n/g, '\n').trim()
  if (normalised.length <= maxChunkChars) {
    return [{ text: normalised, index: 0 }]
  }

  // Step 1: split into paragraphs
  const paragraphs = normalised
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  // Step 2: split long paragraphs further
  const pieces: string[] = []
  for (const para of paragraphs) {
    if (para.length <= maxChunkChars) {
      pieces.push(para)
      continue
    }
    // Try splitting on single newlines first
    const lines = para.split(/\n/).map((l) => l.trim())
    let buffer = ''
    for (const line of lines) {
      if ((buffer + ' ' + line).trim().length <= maxChunkChars) {
        buffer = (buffer + ' ' + line).trim()
      } else {
        if (buffer) pieces.push(buffer)
        if (line.length <= maxChunkChars) {
          buffer = line
        } else {
          // Last resort: split on sentence boundaries
          const sentences = line.split(/(?<=[.!?])\s+/)
          buffer = ''
          for (const sent of sentences) {
            if ((buffer + ' ' + sent).trim().length <= maxChunkChars) {
              buffer = (buffer + ' ' + sent).trim()
            } else {
              if (buffer) pieces.push(buffer)
              // Hard cut if a single sentence exceeds max
              if (sent.length <= maxChunkChars) {
                buffer = sent
              } else {
                for (let i = 0; i < sent.length; i += maxChunkChars) {
                  pieces.push(sent.slice(i, i + maxChunkChars))
                }
                buffer = ''
              }
            }
          }
        }
      }
    }
    if (buffer) pieces.push(buffer)
  }

  // Step 3: merge tiny pieces (< 100 chars) into the previous piece
  const merged: string[] = []
  for (const piece of pieces) {
    if (piece.length < 100 && merged.length > 0) {
      const last = merged[merged.length - 1]
      if ((last + ' ' + piece).length <= maxChunkChars) {
        merged[merged.length - 1] = last + ' ' + piece
        continue
      }
    }
    merged.push(piece)
  }

  // Step 4: add overlap. Each chunk (except the first) starts with the last
  // `overlapChars` of the previous chunk.
  const chunks: Chunk[] = []
  for (let i = 0; i < merged.length; i++) {
    let text = merged[i]
    if (i > 0 && overlapChars > 0) {
      const prev = merged[i - 1]
      const overlap = prev.slice(-overlapChars)
      // Don't duplicate if the overlap is already at the start
      if (!text.startsWith(overlap)) {
        text = overlap + ' ' + text
      }
    }
    chunks.push({ text, index: i })
  }

  return chunks
}
