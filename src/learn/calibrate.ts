// ─── Track B · LEARN — offline calibration (advisory only) ───────────────────
// Reads the historical table and PROPOSES tuned constants for the heuristic
// planner. It NEVER writes back into the live path — output is a reviewed report
// (learn/artifacts/calibration.json). The live planner keeps using the committed
// constants in src/engine/recommend.ts and src/engine/risk.ts until a human
// adopts a change.

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { HistoryTable } from './history/schema'

// Current live constants (mirrored here for comparison — NOT imported, so this
// module can never accidentally mutate them). Keep in sync with:
//   engine/recommend.ts: MM_TO_LEVEL = 0.8, WATCH_LEVEL = 62
const CURRENT = { MM_TO_LEVEL: 0.8, WATCH_LEVEL: 62 }

export interface CalibrationReport {
  current: typeof CURRENT
  suggested: typeof CURRENT
  rationale: string[]
  sampleSize: number
  /** Loud reminder that this is advisory. */
  advisory: string
  generatedAt: number
}

/** Suggest a rainfall→level factor and a watch threshold from past events. */
export function calibrate(table: HistoryTable): CalibrationReport {
  const rows = table.rows
  const rationale: string[] = []

  // MM_TO_LEVEL: relate event rainfall to the peak observed level rise.
  // Levels here are heterogeneous (m / %), so we use a robust median ratio and
  // clamp — this is a coarse, transparent estimate, not a fitted model.
  const ratios = rows
    .map((r) => {
      const peak = Math.max(0, ...Object.values(r.waterLevels))
      return r.rainfall_mm > 0 ? (peak * 100) / r.rainfall_mm : null // scale m→"level units"
    })
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b)
  const median = ratios.length ? ratios[Math.floor(ratios.length / 2)] : CURRENT.MM_TO_LEVEL
  const suggestedMmToLevel = +Math.min(1.4, Math.max(0.4, median)).toFixed(2)
  rationale.push(
    `MM_TO_LEVEL: median rain→level ratio across ${ratios.length} events ≈ ${median.toFixed(2)} → เสนอ ${suggestedMmToLevel} (ปัจจุบัน ${CURRENT.MM_TO_LEVEL})`,
  )

  // WATCH_LEVEL: pick a threshold that best separates contained vs flooding.
  const flooded = rows.filter((r) => r.outcome !== 'contained')
  const contained = rows.filter((r) => r.outcome === 'contained')
  const floodMin = flooded.length ? Math.min(...flooded.map((r) => peakPct(r))) : CURRENT.WATCH_LEVEL
  const containMax = contained.length ? Math.max(...contained.map((r) => peakPct(r))) : CURRENT.WATCH_LEVEL
  const suggestedWatch = +Math.min(85, Math.max(45, (floodMin + containMax) / 2)).toFixed(0)
  rationale.push(
    `WATCH_LEVEL: contained peaked ≤ ${containMax.toFixed(0)}, flooding started ≥ ${floodMin.toFixed(0)} → เสนอ ${suggestedWatch} (ปัจจุบัน ${CURRENT.WATCH_LEVEL})`,
  )

  return {
    current: CURRENT,
    suggested: { MM_TO_LEVEL: suggestedMmToLevel, WATCH_LEVEL: suggestedWatch },
    rationale,
    sampleSize: rows.length,
    advisory: 'ADVISORY ONLY — ค่าที่เสนอนี้ต้องได้รับการทบทวนจากมนุษย์ก่อนนำไปใช้ ไม่ถูกนำเข้า live path โดยอัตโนมัติ',
    generatedAt: Date.now(),
  }
}

/** Normalize a row's peak level to a rough 0–130 "% of design" scale for thresholding. */
function peakPct(r: { waterLevels: Record<string, number> }): number {
  const peak = Math.max(0, ...Object.values(r.waterLevels))
  return peak <= 3 ? peak * 40 : peak // treat metre-scale gauges as ~x40, leave %-scale as-is
}

/** Write the report to learn/artifacts/calibration.json (offline artifact). */
export function writeCalibration(report: CalibrationReport, cwd = process.cwd()): string {
  const dir = resolve(cwd, 'learn/artifacts')
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, 'calibration.json')
  writeFileSync(out, JSON.stringify(report, null, 2), 'utf8')
  return out
}
