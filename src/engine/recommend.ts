import type { Recommendation, StationState, TideState } from '../data/types'
import { clamp } from '../lib/util'

// ─── AquaFlow coordinated planner — heuristic v1 ─────────────────────────────
// HONESTY NOTE: this is a transparent RULE-BASED stand-in for the ML/RL model,
// not a trained model — and it is labeled as such in the UI and README. It is
// deliberately shaped like a policy so a learned model can later replace this
// module behind the exact same recommend() interface.
//
// Inputs per station: current level (% of design capacity), pump capacity,
// forecast rain at the station's own location (Open-Meteo), tide phase/height
// (the Chao Phraya is tidal — pumping into a high river backfeeds the city),
// and the shared downstream discharge node.
//
// Rules:
//   1. Project near-term inflow from the 3-h rain forecast → projected level.
//   2. Rank stations by time-to-overflow (highest projected level first).
//   3. Tide-aware: prefer pumping to the river while the tide is falling;
//      at high rising tide the river has no headroom → "รอ & เฝ้าระวัง".
//   4. Coordination (anti-"move-the-flood-elsewhere"): never recommend
//      simultaneous pumping of every station that discharges into the same
//      downstream node — the first (most urgent) station per node pumps,
//      the rest are staggered with an explicit wait reason.

/** mm of rain over 3 h → % level rise (coarse catchment factor). */
const MM_TO_LEVEL = 0.8
const WATCH_LEVEL = 62

export interface EngineInput {
  stations: StationState[]
  tide: TideState
}

function tideHasHeadroom(tide: TideState): boolean {
  const mid = (tide.range[0] + tide.range[1]) / 2
  return tide.phase === 'falling' || tide.height < mid
}

export type DrainTone = 'ok' | 'caution' | 'hold'
export interface DrainSafety {
  tone: DrainTone
  /** Short Thai verdict — "ระบายลงได้" / "ระบายได้จำกัด" / "ยังไม่ควรเร่งระบาย". */
  label: string
  reason: string
}

/**
 * Per-station answer to "is it OK to push more water down from here right now?".
 * Combines the station's own headroom, the tide (a full Chao Phraya has no room),
 * and how loaded its downstream node is. Drives the risk badge on the station card.
 */
export function drainSafety(s: StationState, tide: TideState, stations: StationState[]): DrainSafety {
  const drainsToRiver = s.downstream.startsWith('CP')
  const headroom = tideHasHeadroom(tide)
  if (drainsToRiver && !headroom) {
    return {
      tone: 'hold',
      label: 'ยังไม่ควรเร่งระบาย',
      reason: `น้ำทะเลกำลังขึ้น (${tide.height.toFixed(2)} ม.) — แม่น้ำเจ้าพระยาเต็ม การเร่งสูบตอนนี้จะดันน้ำย้อนกลับเข้าเมือง ควรรอรอบน้ำลง`,
    }
  }
  const sameNodePumping = stations.filter((x) => x.pumping && x.downstream === s.downstream).length
  if (sameNodePumping >= 3) {
    return {
      tone: 'caution',
      label: 'ระบายได้จำกัด',
      reason: `มี ${sameNodePumping} สถานีกำลังระบายลงโหนดเดียวกัน (${s.downstream}) — เพิ่มอีกเสี่ยงย้ายน้ำท่วมไปเขตปลายน้ำ`,
    }
  }
  if (s.level < 40) {
    return {
      tone: 'caution',
      label: 'ระบายได้จำกัด',
      reason: `ระดับน้ำต่ำแล้ว (${s.level.toFixed(0)}%) — ระบายเพิ่มได้ผลน้อย`,
    }
  }
  return {
    tone: 'ok',
    label: 'ระบายลงได้',
    reason: `${headroom ? 'น้ำทะเลกำลังลง แม่น้ำมีที่ว่างรับน้ำ' : 'ปลายทางยังมีที่ว่างรับน้ำ'} — เปิดระบายได้เต็มที่`,
  }
}

function actionLabel(s: StationState): 'pump' | 'open_gate' {
  return s.type === 'floodgate' ? 'open_gate' : 'pump'
}

export function recommend({ stations, tide }: EngineInput): Recommendation[] {
  const headroom = tideHasHeadroom(tide)
  const tideTxt =
    tide.phase === 'falling'
      ? `น้ำทะเลกำลังลง (${tide.height.toFixed(2)} ม.) แม่น้ำเจ้าพระยามีที่ว่างรับน้ำ`
      : `น้ำทะเลกำลังขึ้น (${tide.height.toFixed(2)} ม.)`

  const candidates = stations
    .filter((s) => !s.pumping)
    .map((s) => {
      const projected = clamp(s.level + s.rain3h * MM_TO_LEVEL, 0, 130)
      // urgency: projected overflow + how fast it's getting there + asset size
      const score = projected + s.rain3h * 1.5 + s.capacity_cms / 20
      return { s, projected, score }
    })
    .filter(({ s, projected }) => projected > WATCH_LEVEL || s.level > WATCH_LEVEL)
    .sort((a, b) => b.score - a.score)

  const nodeTaken = new Map<string, string>() // downstream node → station already pumping there
  for (const st of stations.filter((s) => s.pumping)) {
    nodeTaken.set(st.downstream, st.name)
  }

  const recs: Recommendation[] = []
  for (const { s, projected, score } of candidates.slice(0, 6)) {
    const drainsToRiver = s.downstream.startsWith('CP')
    const takenBy = nodeTaken.get(s.downstream)
    const riskReduction = Math.round(clamp((s.level - 45) * 0.22 + s.capacity_cms / 18, 2, 18))
    const rainTxt =
      s.rain3h >= 1
        ? `คาดฝน ${s.rain3h.toFixed(0)} มม. ใน 3 ชม. → ระดับน้ำจะขึ้นไปแตะ ~${projected.toFixed(0)}%`
        : 'ฝนระยะสั้นน้อย'

    if (drainsToRiver && !headroom) {
      // High rising tide: pumping now pushes water against a full river.
      recs.push({
        id: `rec-${s.id}`,
        stationId: s.id,
        stationName: s.name,
        action: 'wait',
        reason: `ระดับน้ำ ${s.level.toFixed(0)}% · ${rainTxt} · แต่${tideTxt} — แม่น้ำเต็ม การสูบตอนนี้จะดันน้ำย้อนกลับ แนะนำรอรอบน้ำลงแล้วสูบทันที`,
        riskReduction: 0,
        score,
      })
      continue
    }
    if (takenBy) {
      // Coordination rule: this node is already receiving a discharge.
      recs.push({
        id: `rec-${s.id}`,
        stationId: s.id,
        stationName: s.name,
        action: 'wait',
        reason: `ระดับน้ำ ${s.level.toFixed(0)}% · ${rainTxt} · แต่ ${takenBy} กำลังระบายลงโหนดเดียวกัน (${s.downstream}) — สูบพร้อมกันจะย้ายน้ำท่วมไปเขตปลายน้ำ จึงจัดคิวสลับกัน`,
        riskReduction: 0,
        score: score - 5,
      })
      continue
    }
    nodeTaken.set(s.downstream, s.name)
    const verb = s.type === 'floodgate' ? 'เปิดประตูระบาย' : 'สูบเดี๋ยวนี้'
    recs.push({
      id: `rec-${s.id}`,
      stationId: s.id,
      stationName: s.name,
      action: actionLabel(s),
      reason: `ระดับน้ำ ${s.level.toFixed(0)}% ของความจุ · ${rainTxt} · ${tideTxt} → ${verb}ได้ผลสูงสุด (กำลังระบาย ${s.capacity_cms} ลบ.ม./วินาที)`,
      riskReduction,
      score,
    })
  }
  return recs.sort((a, b) => b.score - a.score).slice(0, 5)
}
