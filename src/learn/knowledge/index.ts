// ─── Track B · LEARN — local knowledge index + retrieval ─────────────────────
// Builds an in-memory vector index over the committed corpus and retrieves
// grounding snippets. Offline (Node) only; results are used to ANNOTATE operator
// explanations, never to drive the planner.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cosineSim, type EmbeddingVector, type KnowledgeProvider } from './provider'

export interface KnowledgeDoc {
  id: string
  title: string
  source: string
  tags: string[]
  text: string
}

export interface IndexedDoc extends KnowledgeDoc {
  embedding: EmbeddingVector
}

export interface Retrieval {
  doc: KnowledgeDoc
  score: number
}

const CORPUS_PATH = 'src/learn/knowledge/corpus.seed.json'

/** Load the committed seed corpus from disk (offline). */
export function loadCorpus(cwd = process.cwd()): KnowledgeDoc[] {
  const abs = resolve(cwd, CORPUS_PATH)
  if (!existsSync(abs)) return []
  const parsed = JSON.parse(readFileSync(abs, 'utf8')) as { docs: KnowledgeDoc[] }
  return parsed.docs ?? []
}

/** Embed every doc once. */
export function buildIndex(provider: KnowledgeProvider, docs: KnowledgeDoc[]): IndexedDoc[] {
  return docs.map((d) => ({ ...d, embedding: provider.embed(`${d.title}\n${d.text}\n${d.tags.join(' ')}`) }))
}

/** Return the top-k docs most similar to the query. */
export function retrieve(
  index: IndexedDoc[],
  provider: KnowledgeProvider,
  query: string,
  k = 3,
): Retrieval[] {
  const q = provider.embed(query)
  return index
    .map((doc) => ({ doc, score: cosineSim(q, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ doc, score }) => ({ doc: stripEmbedding(doc), score: +score.toFixed(3) }))
}

function stripEmbedding(d: IndexedDoc): KnowledgeDoc {
  const { embedding: _embedding, ...rest } = d
  return rest
}
