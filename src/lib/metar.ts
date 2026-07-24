import type { Station, StationState, TideState } from '../data/types'

// ─── Water-condition encoding for the AI planner ─────────────────────────────
// Bangkok pump sumps and canals carry a laser/ultrasonic level sensor at the
// bank. It reads the distance down to the water; combined with the known bed
// depth that gives a real water-column depth (m) and the metres of freeboard
// left before the water tops the bank.
//
// These helpers turn a station's % level into those physical quantities and
// pack the whole state into a compact METAR-style string — the same shape an
// aviation weather report uses — so every station has ONE canonical coded line
// the heuristic/ML model reads as input. Decoding it back is trivial, which is
// exactly why it is a good honest feature vector to hand a model.

/** Current water-column depth from the laser sensor (m), from % level and bed depth. */
export function laserDepth(s: Pick<Station, 'bedDepth_m'> & { level: number }): number {
  return +((s.level / 100) * s.bedDepth_m).toFixed(2)
}

/** Metres of headroom before the water reaches the bank. */
export function freeboard(s: Pick<Station, 'bedDepth_m'> & { level: number }): number {
  return +(s.bedDepth_m - laserDepth(s)).toFixed(2)
}

function pad3(n: number): string {
  return Math.round(n).toString().padStart(3, '0')
}

/**
 * METAR-style coded condition line, e.g.
 *   `PHRAKHANONG 1200Z L068 DPT3.20/4.70M FB1.50M R012 TDF120 DIS/CP-S WATCH`
 * fields: level%, laser depth / bed depth, freeboard, rain-3h mm, tide phase+cm,
 * discharge node, status. This is the per-station feature vector the AI ingests.
 */
export function stationMetar(s: StationState, tide: TideState, at: Date = new Date()): string {
  const time = `${at.getHours().toString().padStart(2, '0')}${at.getMinutes().toString().padStart(2, '0')}Z`
  const depth = laserDepth(s)
  const fb = freeboard(s)
  const rain = pad3(s.rain3h)
  const tideCode = `TD${tide.phase === 'falling' ? 'F' : 'R'}${pad3(tide.height * 100)}`
  const trend = s.trend > 0.5 ? 'RISING' : s.trend < -0.5 ? 'DRAINING' : 'STEADY'
  const status = s.pumping ? 'PUMPING' : s.status.toUpperCase()
  return [
    s.id.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    time,
    `L${pad3(s.level)}`,
    `DPT${depth.toFixed(2)}/${s.bedDepth_m.toFixed(2)}M`,
    `FB${fb.toFixed(2)}M`,
    `R${rain}`,
    tideCode,
    `DIS/${s.downstream}`,
    trend,
    status,
  ].join(' ')
}
