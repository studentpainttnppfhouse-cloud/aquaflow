// ─── Track A · LIVE — the unified adapter registry ───────────────────────────
// Every real-time source is exposed here as a Reading<T> via runTiers(). These
// wrap the existing domain fetchers (openMeteo/tide/thaiWater) so behaviour is
// preserved, while adding provenance, confidence, fetchedAt and the hard rule
// that international sources are only ever labeled 'backup'.

import type { Gauge, RainState, Station, TideState } from '../types'
import { runTiers, type Reading } from './types'
import { sourceConfig } from './config'
import { fetchRain } from './openMeteo'
import { fetchTide } from './tide'
import { fetchWaterLevels } from './thaiWater'
import pumpGateJson from '../fallback/pumpGate.json'

export interface PumpGateStatus {
  stationId: string
  name: string
  online: boolean
  mode: 'auto' | 'manual' | 'unknown'
}

const TODO_NOTE = (label: string) => `TODO(paint): แหล่งข้อมูลหลัก (${label}) ยังไม่ได้เชื่อมต่อ`

// ── rainfall ─────────────────────────────────────────────────────────────────
// Domestic HII/Met Dept (TODO) → Open-Meteo (international → backup) → cache → sim.
// The existing fetchRain() already returns feed live|cached; we treat its "live"
// (Open-Meteo) as an international BACKUP and its "cached" as our committed cache.
export async function readRainfall(stations: Station[]): Promise<Reading<RainState>> {
  const cfg = sourceConfig('rainfall')
  return runTiers<RainState>('rainfall', cfg.unit, [
    { provenance: 'live', origin: 'domestic', run: () => null, note: TODO_NOTE(cfg.label) },
    {
      provenance: 'backup',
      origin: 'international',
      run: async () => {
        const r = await fetchRain(stations)
        return r.feed === 'live' ? r : null // only count a genuine Open-Meteo hit as the backup tier
      },
    },
    {
      // fetchRain always resolves; on network failure it returns the committed snapshot.
      provenance: 'cache',
      origin: 'domestic',
      run: () => fetchRain(stations),
    },
  ])
}

// ── tideLevel ────────────────────────────────────────────────────────────────
// Domestic Hydrographic Dept (TODO) → WorldTides/Marine (international → backup)
// → modeled harmonic (sim). fetchTide() encodes that ladder; we map its source.
export async function readTideLevel(): Promise<Reading<TideState>> {
  const cfg = sourceConfig('tideLevel')
  return runTiers<TideState>('tideLevel', cfg.unit, [
    { provenance: 'live', origin: 'domestic', run: () => null, note: TODO_NOTE(cfg.label) },
    {
      provenance: 'backup',
      origin: 'international',
      run: async () => {
        const t = await fetchTide()
        return t.source === 'live' ? t : null // WorldTides/Marine hit → backup
      },
    },
    {
      provenance: 'sim',
      origin: 'domestic',
      run: () => fetchTide(), // resolves to modeled harmonic when both APIs are down
    },
  ])
}

// ── canalRiverLevel ──────────────────────────────────────────────────────────
// Domestic ThaiWater/HII (live) → committed cache. Fully domestic, so it may
// drive decisions when live.
export async function readCanalRiverLevel(): Promise<
  Reading<{ levels: Record<string, number>; gauges: Gauge[] }>
> {
  const cfg = sourceConfig('canalRiverLevel')
  return runTiers('canalRiverLevel', cfg.unit, [
    {
      provenance: 'live',
      origin: 'domestic',
      run: async () => {
        const w = await fetchWaterLevels()
        return w.feed === 'live' ? { levels: w.levels, gauges: w.gauges } : null
      },
    },
    {
      provenance: 'cache',
      origin: 'domestic',
      run: async () => {
        const w = await fetchWaterLevels()
        return { levels: w.levels, gauges: w.gauges }
      },
    },
  ])
}

// ── pumpGateStatus ───────────────────────────────────────────────────────────
// Domestic BMA flood center (TODO) → committed snapshot (cache) → sim.
export async function readPumpGateStatus(): Promise<Reading<PumpGateStatus[]>> {
  const cfg = sourceConfig('pumpGateStatus')
  const snapshot = (pumpGateJson as unknown as { statuses: PumpGateStatus[] }).statuses
  return runTiers<PumpGateStatus[]>('pumpGateStatus', cfg.unit, [
    { provenance: 'live', origin: 'domestic', run: () => null, note: TODO_NOTE(cfg.label) },
    { provenance: 'cache', origin: 'domestic', run: () => snapshot },
    { provenance: 'sim', origin: 'domestic', run: () => [] },
  ])
}
