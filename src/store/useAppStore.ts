import { create } from 'zustand'
import type {
  Canal,
  DataFeed,
  Gauge,
  LogEntry,
  RainState,
  RecAction,
  Recommendation,
  StationState,
  TideState,
} from '../data/types'
import { fetchRain, next3hMm } from '../data/adapters/openMeteo'
import { fetchStations } from '../data/adapters/stations'
import { fetchTide, modeledTideAt } from '../data/adapters/tide'
import { fetchWaterLevels } from '../data/adapters/thaiWater'
import { recommend } from '../engine/recommend'
import { clamp, fmtTime, hash01, prefersReducedMotion, uid } from '../lib/util'

export type View = 'landing' | 'guide-control' | 'guide-citizen' | 'control' | 'citizen'
export type OpsMode = 'confirm' | 'semi'
export type StormPhase = 'idle' | 'building' | 'peak' | 'receding' | 'clearing'

const SIM_TICK_MS = 3000
/** Easing rate constant — displayed values close ~90% of the gap to target in ~1 s, fully settling over ~2 s. */
const EASE_K = 2.2

// ── Storm scenario (bounded time-lapse) ────────────────────────────────────
// A simulated storm is NOT endless rain: it is a fixed ~3-hour event compressed
// into a fast time-lapse. STORM_STEPS ticks carry it from t=0 → t=1, each tick
// advancing the virtual clock by (STORM_MINUTES / STORM_STEPS) minutes. Rain
// follows a narrative arc — chill onset, a sustained climax, then a long taper
// to zero — so the operator sees levels surge toward danger, then the inflow
// stop on its own, exactly the "water rushes in, then equalizes" shape.
const STORM_STEPS = 22
const STORM_MINUTES = 180

/** 0→1 storm progress → rainfall multiplier (0..1): fast onset, sustained peak, long taper. */
function stormIntensity(t: number): number {
  if (t <= 0 || t >= 1) return 0
  const rise = Math.min(1, t / 0.18) // ramp up over the first ~18%
  const fall = t < 0.45 ? 1 : Math.max(0, 1 - (t - 0.45) / 0.55) // taper from 45% → 100%
  return rise * fall
}

function stormPhaseOf(t: number): StormPhase {
  if (t <= 0 || t >= 1) return 'idle'
  if (t < 0.18) return 'building'
  if (t < 0.45) return 'peak'
  if (t < 0.85) return 'receding'
  return 'clearing'
}

interface AppState {
  ready: boolean
  view: View
  guideSeen: { control: boolean; citizen: boolean }
  stations: StationState[]
  canals: Canal[]
  gauges: Gauge[]
  cityRisk: number
  targetRisk: number
  tide: TideState
  rain: RainState
  recommendations: Recommendation[]
  activityLog: LogEntry[]
  district: string
  mode: OpsMode
  narration: string
  storm: boolean
  /** Storm progress 0→1 through the bounded time-lapse event. */
  stormT: number
  /** Simulated minutes elapsed within the storm event (0..STORM_MINUTES). */
  stormMinutes: number
  stormPhase: StormPhase
  feeds: { rain: DataFeed; water: DataFeed; tide: DataFeed; stations: DataFeed }
  /** Station selected on the Control Center map — drives the Node Detail rail panel. */
  selectedStationId: string | null

  init: () => Promise<void>
  setView: (v: View) => void
  finishGuide: (which: 'control' | 'citizen') => void
  setDistrict: (d: string) => void
  setMode: (m: OpsMode) => void
  approve: (recId: string) => void
  commandStation: (stationId: string) => void
  selectStation: (stationId: string | null) => void
  /** One-tap coordinated response: drain/open every over-threshold station at once to equalize the network. */
  equalizeNetwork: () => void
  /** Push an emergency flood warning to residents of a district (records it in the ops log). */
  broadcastAlert: (district: string) => void
  simulateStorm: () => void
  reset: () => void
}

/** Level at or below which a station is already balanced and left alone by equalizeNetwork. */
const SAFE_FLOOR = 45

function log(text: string, kind: LogEntry['kind'] = 'action'): LogEntry {
  return { id: uid('log'), time: fmtTime(new Date()), text, kind }
}

function statusOf(s: StationState): StationState['status'] {
  if (s.pumping) return 'pumping'
  if (s.level > 85) return 'risk'
  if (s.level > 65) return 'watch'
  return 'ok'
}

function computeTargetRisk(stations: StationState[], rainCity: number, tide: TideState): number {
  if (!stations.length) return 30
  const capSum = stations.reduce((s, x) => s + x.capacity_cms, 0)
  const wLevel = stations.reduce((s, x) => s + x.targetLevel * x.capacity_cms, 0) / capSum
  const tideMid = (tide.range[0] + tide.range[1]) / 2
  const tideFactor = tide.phase === 'rising' && tide.height > tideMid ? 8 : 0
  return clamp(wLevel * 0.85 + Math.min(20, rainCity * 1.4) + tideFactor, 3, 99)
}

let loopsStarted = false

export const useAppStore = create<AppState>((set, get) => {
  // ── engine helpers ─────────────────────────────────────────────────────────

  const refreshRecommendations = () => {
    const { stations, tide } = get()
    set({ recommendations: recommend({ stations, tide }) })
  }

  const execute = (stationId: string, action: RecAction, auto = false) => {
    const { stations, activityLog, cityRisk } = get()
    const st = stations.find((s) => s.id === stationId)
    if (!st || st.pumping || action === 'wait') return
    const verb = st.type === 'floodgate' ? 'เปิดประตูระบายน้ำ' : 'เริ่มสูบน้ำ'
    const next = stations.map((s) =>
      s.id === stationId ? { ...s, pumping: true, status: 'pumping' as const } : s,
    )
    const entry = log(`${auto ? '🤖 กึ่งอัตโนมัติ: ' : '✅ อนุมัติ: '}${verb} — ${st.name} (${st.capacity_cms} ลบ.ม./ว.)`)
    set({
      stations: next,
      activityLog: [entry, ...activityLog].slice(0, 40),
      narration: `🔻 ${st.name} กำลังระบายน้ำ · ความเสี่ยงเมืองอยู่ที่ ${cityRisk.toFixed(0)}% และกำลังลดลง`,
    })
    refreshRecommendations()
  }

  // ── simulation tick: inflow from rain, drain from pumping ─────────────────

  const simTick = () => {
    const state = get()
    if (!state.ready) return
    const { rain, storm, tide } = state
    let anyStopped: string | null = null

    // Advance the bounded storm clock. The event runs its narrative arc and then
    // clears itself — rain is never open-ended.
    let stormT = state.stormT
    let stormActive = storm
    let stormEnded = false
    if (storm) {
      stormT = Math.min(1, stormT + 1 / STORM_STEPS)
      if (stormT >= 1) {
        stormActive = false
        stormEnded = true
      }
    }
    const intensity = stormActive ? stormIntensity(stormT) : 0
    const stormMinutes = Math.round(stormT * STORM_MINUTES)
    const stormPhase = stormActive ? stormPhaseOf(stormT) : 'idle'

    const stations = state.stations.map((s) => {
      // Storm rainfall follows the intensity curve (peaks at the climax, tapers to 0);
      // outside a storm we use the real per-station forecast.
      const mm3h = stormActive ? intensity * (26 + hash01(s.id) * 18) : rain.perStation[s.id] ?? 0
      // inflow: rain accumulates; a light base seepage keeps the sim alive
      const inflow = mm3h * 0.05 + 0.05
      let target = s.targetLevel + inflow
      let pumping = s.pumping
      if (pumping) {
        target -= 1.5 + s.capacity_cms / 45 // big stations drain visibly faster
        if (target <= 34) {
          pumping = false
          anyStopped = s.name
          target = Math.max(target, 30)
        }
      }
      const next: StationState = {
        ...s,
        pumping,
        rain3h: +mm3h.toFixed(1),
        targetLevel: clamp(target, 8, 118),
        trend: +(((target - s.targetLevel) / (SIM_TICK_MS / 1000)) * 60).toFixed(1),
      }
      next.status = statusOf(next)
      return next
    })

    const rainCity = stormActive ? intensity * 34 : next3hMm(rain.hours)
    const targetRisk = computeTargetRisk(stations, rainCity, tide)

    const patch: Partial<AppState> = {
      stations,
      targetRisk,
      storm: stormActive,
      stormT,
      stormMinutes,
      stormPhase,
    }
    const logs: LogEntry[] = []
    if (anyStopped) {
      logs.push(log(`⏹ ${anyStopped} ระบายถึงระดับปลอดภัยแล้ว หยุดสูบอัตโนมัติ`, 'system'))
    }
    if (stormEnded) {
      logs.push(log('🌤️ พายุฝนจำลองเคลื่อนผ่านแล้ว (ครบ 3 ชม.) — ฝนหยุดตก เข้าสู่ช่วงระบายน้ำ', 'system'))
    }
    if (logs.length) {
      patch.activityLog = [...logs, ...state.activityLog].slice(0, 40)
    }

    // narration heartbeat
    const pumping = stations.filter((s) => s.pumping).length
    const atRisk = stations.filter((s) => s.status === 'risk').length
    if (stormActive) {
      const phaseTxt =
        stormPhase === 'building'
          ? 'ฝนเริ่มตก'
          : stormPhase === 'peak'
            ? 'ฝนตกหนักสุด'
            : stormPhase === 'receding'
              ? 'ฝนเริ่มซา'
              : 'ฝนใกล้หยุด'
      patch.narration = `⛈️ ไทม์แลปส์พายุ ชั่วโมงที่ ${(stormMinutes / 60).toFixed(1)}/3.0 · ${phaseTxt} · ${atRisk} สถานีแตะระดับเสี่ยง${pumping > 0 ? ` · ระบาย ${pumping} จุด` : ' — กด “ปรับสมดุลน้ำ” เพื่อระบายทั้งเครือข่าย'}`
    } else if (pumping > 0) {
      patch.narration = `🔻 กำลังระบายน้ำ ${pumping} จุด · ความเสี่ยงเมือง ${state.cityRisk.toFixed(0)}% และกำลังลดลง`
    } else if (atRisk > 0) {
      patch.narration = `⚠️ ${atRisk} สถานีอยู่ในระดับเฝ้าระวังสูง · น้ำทะเล${tide.phase === 'falling' ? 'กำลังลง เหมาะแก่การสูบ' : 'กำลังขึ้น'}`
    } else {
      patch.narration = `🟢 ระบบปกติ · เฝ้าระวัง ${stations.length} สถานี · น้ำทะเล ${tide.height.toFixed(2)} ม. (${tide.phase === 'falling' ? 'ลง' : 'ขึ้น'})`
    }
    set(patch)
    refreshRecommendations()

    // semi-auto mode: the operator has pre-authorized clear-cut actions
    const after = get()
    if (after.mode === 'semi') {
      const top = after.recommendations.find((r) => r.action !== 'wait' && r.score > 80)
      if (top) execute(top.stationId, top.action, true)
    }
  }

  // ── per-frame easing: displayed values glide toward targets ───────────────

  let lastFrame = performance.now()
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - lastFrame) / 1000)
    lastFrame = now
    const s = get()
    if (s.ready) {
      const k = prefersReducedMotion() ? 30 : EASE_K
      const a = 1 - Math.exp(-dt * k)
      const cityRisk = s.cityRisk + (s.targetRisk - s.cityRisk) * a
      let dirty = Math.abs(cityRisk - s.cityRisk) > 0.005
      const stations = s.stations.map((st) => {
        const level = st.level + (st.targetLevel - st.level) * a
        if (Math.abs(level - st.level) > 0.005) {
          dirty = true
          const next = { ...st, level }
          next.status = statusOf(next)
          return next
        }
        return st
      })
      if (dirty) set({ cityRisk, stations })
    }
    requestAnimationFrame(frame)
  }

  return {
    ready: false,
    view: 'landing',
    guideSeen: { control: false, citizen: false },
    stations: [],
    canals: [],
    gauges: [],
    cityRisk: 0,
    targetRisk: 30,
    tide: { height: 1.2, phase: 'rising', source: 'modeled', series: [], range: [0, 2.4] },
    rain: { hours: [], perStation: {}, feed: 'cached' },
    recommendations: [],
    activityLog: [],
    district: 'พระโขนง',
    mode: 'confirm',
    narration: 'กำลังเชื่อมต่อแหล่งข้อมูล…',
    storm: false,
    stormT: 0,
    stormMinutes: 0,
    stormPhase: 'idle',
    feeds: { rain: 'cached', water: 'cached', tide: 'modeled', stations: 'cached' },
    selectedStationId: null,

    init: async () => {
      if (get().ready) return
      const stationsRes = await fetchStations()
      const [rainRes, tideRes, waterRes] = await Promise.all([
        fetchRain(stationsRes.stations),
        fetchTide(),
        fetchWaterLevels(),
      ])
      const stations: StationState[] = stationsRes.stations.map((s) => {
        const level = waterRes.levels[s.id] ?? 55
        const st: StationState = {
          ...s,
          level,
          targetLevel: level,
          trend: 0,
          pumping: false,
          status: 'ok',
          rain3h: rainRes.perStation[s.id] ?? 0,
        }
        st.status = statusOf(st)
        return st
      })
      set({
        ready: true,
        stations,
        canals: stationsRes.canals,
        gauges: waterRes.gauges,
        rain: rainRes,
        tide: tideRes,
        cityRisk: 0,
        targetRisk: computeTargetRisk(stations, next3hMm(rainRes.hours), tideRes),
        feeds: {
          rain: rainRes.feed,
          water: waterRes.feed,
          tide: tideRes.source,
          stations: stationsRes.feed,
        },
        activityLog: [
          log(
            `ระบบออนไลน์ · ฝน: ${rainRes.feed === 'live' ? 'Open-Meteo (สด)' : 'สแนปช็อต'} · น้ำ: ${
              waterRes.feed === 'live' ? 'ThaiWater (สด)' : 'สแนปช็อต'
            } · น้ำทะเล: ${tideRes.source === 'live' ? 'สด' : 'แบบจำลอง'}`,
            'system',
          ),
        ],
      })
      refreshRecommendations()
      if (!loopsStarted) {
        loopsStarted = true
        requestAnimationFrame(frame)
        setInterval(simTick, SIM_TICK_MS)
        // refresh live feeds every 15 min; tide phase every minute
        setInterval(async () => {
          const r = await fetchRain(get().stations)
          set((st) => ({ rain: r, feeds: { ...st.feeds, rain: r.feed } }))
        }, 15 * 60e3)
        setInterval(() => {
          const t = get().tide
          if (t.source === 'modeled') {
            const now = Date.now()
            const h = modeledTideAt(now)
            set({ tide: { ...t, height: h, phase: modeledTideAt(now + 60e3) > h ? 'rising' : 'falling' } })
          } else if (t.series.length) {
            const i = Math.max(1, t.series.findIndex((p) => p.t >= Date.now()))
            const cur = t.series[i] ?? t.series[t.series.length - 1]
            const prev = t.series[i - 1]
            set({ tide: { ...t, height: cur.h, phase: cur.h >= prev.h ? 'rising' : 'falling' } })
          }
        }, 60e3)
      }
    },

    setView: (view) => {
      const g = get().guideSeen
      if (view === 'control' && !g.control) view = 'guide-control'
      if (view === 'citizen' && !g.citizen) view = 'guide-citizen'
      set({ view })
    },
    finishGuide: (which) =>
      set((s) => ({
        guideSeen: { ...s.guideSeen, [which]: true },
        view: which === 'control' ? 'control' : 'citizen',
      })),
    setDistrict: (district) => set({ district }),
    setMode: (mode) => {
      set({ mode })
      set((s) => ({
        activityLog: [
          log(mode === 'semi' ? 'สลับเป็นโหมดกึ่งอัตโนมัติ — ระบบดำเนินการตามคำแนะนำที่ชัดเจนได้เอง' : 'สลับเป็นโหมดแนะนำ–ยืนยัน — ทุกคำสั่งต้องได้รับอนุมัติ', 'system'),
          ...s.activityLog,
        ],
      }))
    },

    approve: (recId) => {
      const rec = get().recommendations.find((r) => r.id === recId)
      if (rec) execute(rec.stationId, rec.action)
    },
    commandStation: (stationId) => execute(stationId, 'pump'),
    selectStation: (stationId) => set({ selectedStationId: stationId }),

    equalizeNetwork: () => {
      const { stations, activityLog, cityRisk } = get()
      const targets = stations.filter((s) => !s.pumping && s.level > SAFE_FLOOR)
      if (!targets.length) {
        set({ narration: '✅ เครือข่ายอยู่ในสมดุลแล้ว — ไม่มีจุดที่ต้องระบายเพิ่ม' })
        return
      }
      const ids = new Set(targets.map((s) => s.id))
      const next = stations.map((s) =>
        ids.has(s.id) ? { ...s, pumping: true, status: 'pumping' as const } : s,
      )
      set({
        stations: next,
        narration: `⚡ ปรับสมดุลน้ำทั้งเครือข่าย · สั่งระบาย ${targets.length} จุดพร้อมกัน · ความเสี่ยงเมือง ${cityRisk.toFixed(0)}% กำลังลดลง`,
        activityLog: [
          log(`⚡ ปรับสมดุลเครือข่าย: เปิดระบาย/สูบน้ำพร้อมกัน ${targets.length} จุด — ดึงระดับน้ำทุกพื้นที่เข้าสู่ระดับปลอดภัย`),
          ...activityLog,
        ].slice(0, 40),
      })
      refreshRecommendations()
    },

    broadcastAlert: (district) => {
      const { activityLog } = get()
      set({
        narration: `📢 ส่งประกาศเตือนภัยน้ำท่วมถึงประชาชนเขต${district}แล้ว`,
        activityLog: [
          log(`📢 ประกาศเตือนภัย: แจ้งเตือนน้ำท่วมถึงประชาชนเขต${district}`, 'alert'),
          ...activityLog,
        ].slice(0, 40),
      })
    },

    simulateStorm: () => {
      if (get().storm) return
      set((s) => ({
        storm: true,
        stormT: 0,
        stormMinutes: 0,
        stormPhase: 'building',
        narration: '⛈️ เริ่มไทม์แลปส์พายุฝน 3 ชม. — ฝนกำลังเริ่มตก ระดับน้ำจะไต่ขึ้นเข้าสู่จุดวิกฤต แล้วจึงซาลง',
        activityLog: [
          log('⛈️ สถานการณ์จำลอง (ไทม์แลปส์ 3 ชม.): พายุฝนเคลื่อนเข้าปกคลุมกรุงเทพฯ', 'alert'),
          ...s.activityLog,
        ],
      }))
      simTick()
    },

    reset: () => {
      const s = get()
      const levels = (s.stations.length ? s.stations : []).map((st) => ({
        ...st,
        pumping: false,
        targetLevel: 45 + hash01(st.id) * 25,
        trend: 0,
      }))
      levels.forEach((st) => (st.status = statusOf(st)))
      set({
        storm: false,
        stormT: 0,
        stormMinutes: 0,
        stormPhase: 'idle',
        stations: levels,
        recommendations: [],
        narration: '↺ รีเซ็ตสถานการณ์แล้ว · ระบบกลับสู่การเฝ้าระวังปกติ',
        activityLog: [log('↺ รีเซ็ตสถานการณ์จำลอง', 'system'), ...s.activityLog].slice(0, 40),
      })
      refreshRecommendations()
    },
  }
})

/** Local risk for the citizen view: the district's own stations dominate, city-wide risk bleeds in. */
export function districtRisk(state: { stations: StationState[]; cityRisk: number }, district: string): number {
  const local = state.stations.filter((s) => s.district === district)
  if (!local.length) return state.cityRisk
  const avg = local.reduce((s, x) => s + x.level, 0) / local.length
  return clamp(avg * 0.7 + state.cityRisk * 0.35, 2, 99)
}

export function districtCenter(state: { stations: StationState[] }, district: string): [number, number] {
  const local = state.stations.filter((s) => s.district === district)
  if (!local.length) return [13.7563, 100.5018]
  return [
    local.reduce((s, x) => s + x.lat, 0) / local.length,
    local.reduce((s, x) => s + x.lng, 0) / local.length,
  ]
}
