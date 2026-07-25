// ─── Track B · LEARN — local knowledge/RAG provider ──────────────────────────
// Local / self-hosted only: NO external API calls. The embedding here is a
// deterministic hashing bag-of-words STAND-IN so the pipeline runs offline and
// reproducibly. Swap LocalEmbeddingProvider for a real local model (e.g. a
// bundled sentence-transformer) at the marked seam.

export interface EmbeddingVector {
  dims: number
  values: number[]
}

export interface KnowledgeProvider {
  id: string
  embed(text: string): EmbeddingVector
}

const DIMS = 256

/** Tokenize Thai/Latin text coarsely: Latin words + Thai character bigrams. */
function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const latin = lower.match(/[a-z0-9]+/g) ?? []
  const thai = lower.match(/[฀-๿]+/g) ?? []
  const thaiBigrams = thai.flatMap((w) => {
    const grams: string[] = []
    for (let i = 0; i < w.length - 1; i++) grams.push(w.slice(i, i + 2))
    return grams.length ? grams : [w]
  })
  return [...latin, ...thaiBigrams]
}

function hash(token: string): number {
  let h = 2166136261
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % DIMS
}

/**
 * Deterministic local embedding stand-in (hashed bag-of-words, L2-normalized).
 * --- REAL LOCAL MODEL GOES HERE --- TODO(paint): replace `embed` with a call to
 * a bundled/self-hosted embedding model; keep the KnowledgeProvider interface.
 */
export class LocalEmbeddingProvider implements KnowledgeProvider {
  id = 'local-hash-bow-v0 (stand-in)'
  embed(text: string): EmbeddingVector {
    const v = new Array(DIMS).fill(0)
    for (const tok of tokenize(text)) v[hash(tok)] += 1
    const norm = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1
    return { dims: DIMS, values: v.map((x) => x / norm) }
  }
}

export function cosineSim(a: EmbeddingVector, b: EmbeddingVector): number {
  let dot = 0
  const n = Math.min(a.values.length, b.values.length)
  for (let i = 0; i < n; i++) dot += a.values[i] * b.values[i]
  return dot // both are L2-normalized
}
