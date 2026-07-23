// ─── Track B · LEARN — historical ingestion loader ───────────────────────────
// Normalizes past-flood records from heterogeneous raw sources into one
// HistoryTable. Runs OFFLINE (Node) only — never imported by the browser app,
// never in the live decision path.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { HistoryRow, HistoryTable } from './schema'

/** A raw source + the normalizer that maps its bespoke shape into HistoryRow[]. */
export interface RawSource {
  id: string
  label: string
  /** Path to the raw dump. TODO(paint): fill with the real file/export. */
  path: string
  /** Map this source's raw records into normalized rows. TODO(paint) per source. */
  normalize: (raw: unknown) => HistoryRow[]
}

// Real datasets are TODO(paint): their formats/paths are unknown here, so each
// normalizer is a stub returning [] until the raw export is provided.
export const RAW_SOURCES: RawSource[] = [
  { id: '2011', label: 'มหาอุทกภัย 2554 (2011 Thailand floods)', path: 'TODO(paint): 2011 dataset', normalize: () => [] },
  { id: 'hatyai2568', label: 'อุทกภัยหาดใหญ่ 2568 (Hat Yai 2025)', path: 'TODO(paint): Hat Yai 2568 dataset', normalize: () => [] },
  { id: 'onwr', label: 'ONWR / สทนช. open data', path: 'TODO(paint): ONWR open data', normalize: () => [] },
  { id: 'bma-pumplogs', label: 'BMA pump logs', path: 'TODO(paint): BMA pump logs', normalize: () => [] },
]

const SEED_PATH = 'data/history/sample.json'

/**
 * Load and normalize the historical table.
 * - For each RAW_SOURCE whose `path` is a real file, run its normalizer.
 * - Always fold in the committed seed sample so the pipeline is never empty.
 */
export function loadHistory(cwd = process.cwd()): HistoryTable {
  const rows: HistoryRow[] = []
  const sourcesUsed: string[] = []

  for (const src of RAW_SOURCES) {
    if (src.path.startsWith('TODO(')) continue // not wired yet
    const abs = resolve(cwd, src.path)
    if (!existsSync(abs)) continue
    try {
      const raw = JSON.parse(readFileSync(abs, 'utf8'))
      const normalized = src.normalize(raw)
      if (normalized.length) {
        rows.push(...normalized)
        sourcesUsed.push(src.id)
      }
    } catch {
      // never crash the loader on one bad source
    }
  }

  // Committed seed sample (always available).
  const seedAbs = resolve(cwd, SEED_PATH)
  if (existsSync(seedAbs)) {
    const seed = JSON.parse(readFileSync(seedAbs, 'utf8')) as { rows: HistoryRow[] }
    rows.push(...seed.rows)
    sourcesUsed.push('seed-sample')
  }

  return { rows, sourcesUsed, loadedAt: Date.now() }
}
