import type { TidePoint, TideState } from '../types'
import { fetchJson } from '../../lib/util'

// Chao Phraya at Bangkok is tidal (semidiurnal with strong diurnal inequality;
// range roughly 1.5–2.5 m at the river mouth). Order of preference:
//   1. WorldTides (needs VITE_WORLDTIDES_KEY) — https://www.worldtides.info/api
//   2. Open-Meteo Marine sea-level, keyless —
//      https://marine-api.open-meteo.com/v1/marine?latitude=13.45&longitude=100.59&hourly=sea_level_height_msl&timezone=Asia/Bangkok
//   3. Modeled harmonic tide (labeled "modeled" in the UI).
// Either way the pumping logic gets a height + rising/falling phase.

const MARINE_URL =
  'https://marine-api.open-meteo.com/v1/marine?latitude=13.45&longitude=100.59&hourly=sea_level_height_msl&forecast_days=2&timezone=Asia%2FBangkok'

interface MarineResponse {
  hourly: { time: string[]; sea_level_height_msl: (number | null)[] }
}

interface WorldTidesResponse {
  heights?: { dt: number; height: number }[]
}

/** Harmonic model: principal semidiurnal (M2, 12.42 h) + diurnal (K1, 23.93 h) seeded to a realistic Bangkok bar range (~0–2.4 m above datum). */
export function modeledTideAt(tMs: number): number {
  const hours = tMs / 3600e3
  const m2 = 0.85 * Math.sin((2 * Math.PI * hours) / 12.42)
  const k1 = 0.45 * Math.sin((2 * Math.PI * hours) / 23.93 + 1.1)
  return +(1.2 + m2 + k1).toFixed(3)
}

function buildState(series: TidePoint[], source: TideState['source']): TideState {
  const now = Date.now()
  // nearest point to now, and the next one, give height + phase
  let i = series.findIndex((p) => p.t >= now)
  if (i < 1) i = Math.max(1, series.length - 2)
  const cur = series[i]
  const prev = series[i - 1]
  const heights = series.map((p) => p.h)
  return {
    height: cur.h,
    phase: cur.h >= prev.h ? 'rising' : 'falling',
    source,
    series,
    range: [Math.min(...heights), Math.max(...heights)],
  }
}

function modeledSeries(): TidePoint[] {
  const now = Date.now()
  const pts: TidePoint[] = []
  for (let m = -12 * 60; m <= 24 * 60; m += 20) {
    const t = now + m * 60e3
    pts.push({ t, h: modeledTideAt(t) })
  }
  return pts
}

export async function fetchTide(): Promise<TideState> {
  const key = import.meta.env.VITE_WORLDTIDES_KEY as string | undefined
  if (key) {
    try {
      const url = `https://www.worldtides.info/api/v3?heights&lat=13.45&lon=100.59&days=2&key=${key}`
      const res = await fetchJson<WorldTidesResponse>(url)
      if (res.heights?.length) {
        return buildState(
          res.heights.map((h) => ({ t: h.dt * 1000, h: h.height })),
          'live',
        )
      }
    } catch {
      /* fall through */
    }
  }
  try {
    const res = await fetchJson<MarineResponse>(MARINE_URL)
    const pts: TidePoint[] = res.hourly.time
      .map((time, i) => ({ t: new Date(time).getTime(), h: res.hourly.sea_level_height_msl[i] }))
      .filter((p): p is TidePoint => p.h !== null && Number.isFinite(p.h))
      .map((p) => ({ t: p.t, h: +(p.h + 1.2).toFixed(3) })) // shift MSL-relative to a positive datum for display
    if (pts.length > 12) return buildState(pts, 'live')
  } catch {
    /* fall through */
  }
  return buildState(modeledSeries(), 'modeled')
}
