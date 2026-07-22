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

const SIM_TICK_MS = 3000
/** Easing rate constant — displayed values close ~90% of the gap to target in ~1 s, fully settling over ~2 s. */
const EASE_K = 2.2

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
  simulateStorm: () => void
  reset: () => void
}

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

    const stations = state.stations.map((s) => {
      const mm3h = storm ? 25 + hash01(s.id) * 15 : rain.perStation[s.id] ?? 0
      // inflow: rain accumulates; a light base seepage keeps the sim alive
      const inflow = mm3h * 0.045 + 0.05
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

    const rainCity = storm ? 32 : next3hMm(rain.hours)
    const targetRisk = computeTargetRisk(stations, rainCity, tide)

    const patch: Partial<AppState> = { stations, targetRisk }
    if (anyStopped) {
      patch.activityLog = [
        log(`⏹ ${anyStopped} ระบายถึงระดับปลอดภัยแล้ว หยุดสูบอัตโนมัติ`, 'system'),
        ...state.activityLog,
      ].slice(0, 40)
    }

    // narration heartbeat
    const pumping = stations.filter((s) => s.pumping).length
    const atRisk = stations.filter((s) => s.status === 'risk').length
    if (pumping > 0) {
      patch.narration = `🔻 กำลังระบายน้ำ ${pumping} จุด · ความเสี่ยงเมือง ${state.cityRisk.toFixed(0)}% และกำลังลดลง`
    } else if (storm) {
      patch.narration = `⛈️ พายุฝนปกคลุมพื้นที่ · ${atRisk} สถานีแตะระดับเสี่ยง — รอการอนุมัติแผนระบาย`
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

    simulateStorm: () => {
      if (get().storm) return
      set((s) => ({
        storm: true,
        narration: '⛈️ ตรวจพบพายุฝนกำลังแรงเคลื่อนเข้าปกคลุมกรุงเทพฯ — ระดับน้ำทุกคลองกำลังขึ้นเร็ว',
        activityLog: [
          log('⛈️ สถานการณ์จำลอง: พายุฝน 30+ มม./3ชม. ปกคลุมทั้งเมือง', 'alert'),
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
