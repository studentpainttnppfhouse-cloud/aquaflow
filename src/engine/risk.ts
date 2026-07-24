import type { AreaState, DischargeVerdict, StationState, TideState } from '../data/types'
import { clamp } from '../lib/util'

// ─── Downstream-headroom model ───────────────────────────────────────────────
// Answers the operator's core question per station: "can I safely push more
// water down from here, or would that just move the flood downstream / back up
// against a full river?"  Transparent rule-based scoring, not a trained model.
//
// A station discharges into a shared node (`downstream`). River nodes (CP*) are
// tidal — a rising/high Chao Phraya has little headroom to accept pumped water.
// Every node also loses headroom as the stations feeding it fill up and as more
// of them pump into it simultaneously (the anti-"move-the-flood-elsewhere" rule).

function tideHeadroom(node: string, tide: TideState): number {
  if (!node.startsWith('CP')) return 70 // eastern outfalls are not river-tidal
  const span = Math.max(0.01, tide.range[1] - tide.range[0])
  // falling tide → lots of headroom; high rising tide → very little
  const base = clamp(100 - ((tide.height - tide.range[0]) / span) * 100, 0, 100)
  return tide.phase === 'falling' ? clamp(base + 22, 0, 100) : clamp(base - 8, 0, 100)
}

/** Remaining capacity (0–100) of a station's downstream node to accept more water. */
export function nodeHeadroom(node: string, stations: StationState[], tide: TideState): number {
  const peers = stations.filter((s) => s.downstream === node)
  if (!peers.length) return 60
  const avg = peers.reduce((a, s) => a + s.level, 0) / peers.length
  const pumpingHere = peers.filter((s) => s.pumping).length
  const tideH = tideHeadroom(node, tide)
  // node fills from peer levels and from concurrent discharges into it
  return clamp(tideH * 0.55 + (100 - avg) * 0.45 - pumpingHere * 5, 0, 100)
}

export function dischargeVerdict(
  s: StationState,
  stations: StationState[],
  tide: TideState,
): DischargeVerdict {
  const headroom = nodeHeadroom(s.downstream, stations, tide)
  const river = s.downstream.startsWith('CP')
  const tideTxt = river
    ? tide.phase === 'falling'
      ? `น้ำทะเลกำลังลง แม่น้ำมีที่ว่างรับน้ำ`
      : `น้ำทะเลกำลังขึ้น (${tide.height.toFixed(2)} ม.) แม่น้ำรับน้ำได้จำกัด`
    : `ปลายทางออกด้านตะวันออก`
  if (headroom > 55) {
    return {
      ok: true,
      headroom,
      tone: 'green',
      reason: `ปลอดภัยที่จะระบายเพิ่ม — โหนด ${s.downstream} ยังมีที่ว่าง ~${headroom.toFixed(0)}% · ${tideTxt}`,
    }
  }
  if (headroom > 30) {
    return {
      ok: true,
      headroom,
      tone: 'amber',
      reason: `ระบายได้แต่ต้องเฝ้าระวัง — โหนด ${s.downstream} เหลือที่ว่าง ~${headroom.toFixed(0)}% · ${tideTxt}`,
    }
  }
  return {
    ok: false,
    headroom,
    tone: 'coral',
    reason: `ยังไม่ควรระบายเพิ่ม — โหนด ${s.downstream} เกือบเต็ม (ที่ว่าง ~${headroom.toFixed(0)}%) การสูบตอนนี้จะดันน้ำท่วมไปปลายน้ำ · ${tideTxt}`,
  }
}

/** 0–100 composite risk for a station (current + projected level, weighted). */
export function stationRisk(s: StationState): number {
  const projected = clamp(s.level + s.rain3h * 0.8, 0, 140)
  return clamp(s.level * 0.55 + projected * 0.35 + Math.max(0, s.trend) * 2, 0, 100)
}

/** Aggregate stations into per-district areas with risk + plan counts. */
export function buildAreas(
  stations: StationState[],
  tide: TideState,
  activationOf: (district: string) => AreaState['activation'],
): AreaState[] {
  const byDistrict = new Map<string, StationState[]>()
  for (const s of stations) {
    const list = byDistrict.get(s.district) ?? []
    list.push(s)
    byDistrict.set(s.district, list)
  }
  const areas: AreaState[] = []
  for (const [district, list] of byDistrict) {
    const avgLevel = list.reduce((a, s) => a + s.level, 0) / list.length
    const maxLevel = list.reduce((a, s) => Math.max(a, s.level), 0)
    const projected = list.reduce((a, s) => Math.max(a, s.level + s.rain3h * 0.8), 0)
    const atRisk = list.filter((s) => s.status === 'risk').length
    const pumping = list.filter((s) => s.pumping).length
    const actionable = list.filter(
      (s) => !s.pumping && (s.level > 62 || s.level + s.rain3h * 0.8 > 68) && dischargeVerdict(s, stations, tide).ok,
    ).length
    const risk = clamp(avgLevel * 0.45 + maxLevel * 0.35 + atRisk * 6 + Math.min(20, projected - avgLevel), 0, 100)
    areas.push({
      district,
      stationIds: list.map((s) => s.id),
      count: list.length,
      avgLevel,
      maxLevel,
      projected,
      atRisk,
      pumping,
      risk,
      actionable,
      activation: activationOf(district),
    })
  }
  return areas
}
