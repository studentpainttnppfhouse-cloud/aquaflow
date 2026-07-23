// ─── Track B · LEARN — historical dataset (structured) ───────────────────────
// One normalized table for every past-flood record, kept OUT of the live
// decision path. Purpose: (a) calibrate the heuristic planner offline and
// (b) provide grounded context for operator explanations.

export type Outcome = 'contained' | 'minor_flood' | 'major_flood'

/** One past event, normalized from a heterogeneous raw source. */
export interface HistoryRow {
  event: string
  /** ISO-8601 timestamp of the event peak. */
  timestamp: string
  /** Event rainfall total (mm). */
  rainfall_mm: number
  /** gauge/station id → observed water level at peak (m above datum, or % of design). */
  waterLevels: Record<string, number>
  /** Operator actions taken during the event. */
  pumpActions: { stationId: string; action: 'pump' | 'open_gate' | 'wait'; at: string }[]
  outcome: Outcome
  /** Free-text provenance of this row (which dataset it came from). */
  provenance: string
}

export interface HistoryTable {
  rows: HistoryRow[]
  /** Which raw sources contributed, for auditability. */
  sourcesUsed: string[]
  loadedAt: number
}
