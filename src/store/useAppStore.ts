import { create } from 'zustand'
import type {
  Activation,
  AreaState,
  Broadcast,
  Canal,
  Channel,
  DataFeed,
  Gauge,
  LogEntry,
  Notification,
  RainState,
  RecAction,
  Recommendation,
  Severity,
  StationState,
  TideState,
  Zone,
} from '../data/types'
import { next3hMm } from '../data/adapters/openMeteo'
import { fetchStations } from '../data/adapters/stations'
import { modeledTideAt } from '../data/adapters/tide'
import { readCanalRiverLevel, readPumpGateStatus, readRainfall, readTideLevel } from '../data/adapters/live'
import { PROVENANCE_META, type Provenance, type Reading } from '../data/adapters/types'
import { refreshIntervalOf } from '../data/adapters/config'
import { buildZones, zoneReach } from '../data/zones'
import { SEVERITY_META, draftMessage, sendAlert, severityFromRisk } from '../engine/alerting'
import { recommend } from '../engine/recommend'
import { buildAreas, dischargeVerdict } from '../engine/risk'
import { freeboard, laserDepth, stationMetar } from '../lib/metar'
import { clamp, fmtTime, hash01, prefersReducedMotion, uid } from '../lib/util'

export type View = 'landing' | 'guide-control' | 'guide-citizen' | 'control' | 'citizen'
/**
 * Two operating postures (the AI auto-run mode was removed — the system never
 * fires a pump without a human approving it):
 *  · `manual`    — pure human control. Pumps/gates run ONLY when a person clicks.
 *                  The heuristic planner is off. For maintenance, testing new
 *                  equipment, or when a sensor is faulty and the data can't be
 *                  trusted (low-confidence situations).
 *  · `heuristic` — the AI planner reads the network and proposes a coordinated,
 *                  tide-aware plan; a human still approves every action (per
 *                  station or per area) before anything runs.
 */
export type OpsMode = 'manual' | 'heuristic'
export type StormPhase = 'idle' | 'building' | 'peak' | 'receding' | 'clearing'

const SIM_TICK_MS = 3000
/** Easing rate constant — displayed values close ~90% of the gap to target in ~1 s, fully settling over ~2 s. */
const EASE_K = 2.2
/** Don't re-warn about the same district more often than this. */
const WARN_COOLDOWN_MS = 45_000

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
  areas: AreaState[]
  notifications: Notification[]
  /** district → whether its plan is being auto-run. */
  activation: Record<string, Activation>
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
  feeds: { rain: Provenance; water: Provenance; tide: Provenance; stations: DataFeed }
  /** Track A · LIVE — the unified provenance-tagged readings, keyed by config source id. */
  sources: Partial<Record<string, Reading<unknown>>>
  zones: Record<string, Zone>
  broadcasts: Broadcast[]
  /** Simulated connectivity: when false, alerts are queued and flushed on reconnect. */
  online: boolean
  a11yLarge: boolean
  /** Station selected on the Control Center map — drives the floating detail card. */
  selectedStationId: string | null
  /** Station opened in the in-depth per-station planner drawer. */
  plannerStationId: string | null
  /** Sort key for the area list. */
  areaSort: 'risk' | 'level' | 'name' | 'actionable'

  init: () => Promise<void>
  setView: (v: View) => void
  finishGuide: (which: 'control' | 'citizen') => void
  setDistrict: (d: string) => void
  setMode: (m: OpsMode) => void
  setAreaSort: (s: AppState['areaSort']) => void
  approve: (recId: string) => void
  commandStation: (stationId: string) => void
  /** Manual stop — halt a running pump/gate (maintenance, testing, faulty sensor). */
  stopStation: (stationId: string) => void
  selectStation: (stationId: string | null) => void
  /** One-tap coordinated response: drain/open every over-threshold station at once to equalize the network. */
  equalizeNetwork: () => void
  openPlanner: (stationId: string | null) => void
  activateArea: (district: string) => void
  deactivateArea: (district: string) => void
  activateAllAreas: () => void
  approveNotification: (id: string) => void
  dismissNotification: (id: string) => void
  simulateStorm: () => void
  reset: () => void
  /** Fan an alert out to every phone in a district over all channels. */
  broadcastAlert: (district: string, opts?: { severity?: Severity; message?: string; channels?: Channel[] }) => void
  /** One tap: broadcast to every district currently at watch level or above. */
  broadcastAffected: () => void
  setOnline: (online: boolean) => void
  setA11yLarge: (large: boolean) => void
}

/** Level at or below which a station is already balanced and left alone by equalizeNetwork. */
const SAFE_FLOOR = 45

function log(text: string, kind: LogEntry['kind'] = 'action'): LogEntry {
  return { id: uid('log'), time: fmtTime(new Date()), text, kind }
}

/** Surface a warning for any source that is degraded (backup/sim) or not usable for a decision. */
function backupWarningLogs(readings: Reading<unknown>[]): LogEntry[] {
  return readings
    .filter((r) => r.provenance === 'backup' || r.provenance === 'sim')
    .map((r) =>
      log(
        `⚠️ แหล่งข้อมูล "${r.source}" กำลังใช้ชั้น "${PROVENANCE_META[r.provenance].th}"${
          r.usableForDecision ? '' : ' — ห้ามใช้ตัดสินใจโดยลำพัง'
        }`,
        'alert',
      ),
    )
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
  // Coordinated-response credit: when a large share of network capacity is
  // actively draining, the city is measurably safer *now* (water is leaving
  // faster than the stored levels alone imply). This makes activating the plan
  // pull the risk number down immediately — even mid-storm — instead of only
  // after levels have finished easing. Capped so risk never fully hides an
  // ongoing storm.
  const pumpCap = stations.reduce((s, x) => s + (x.pumping ? x.capacity_cms : 0), 0)
  const drainRelief = (capSum ? pumpCap / capSum : 0) * 26
  return clamp(wLevel * 0.85 + Math.min(20, rainCity * 1.4) + tideFactor - drainRelief, 3, 99)
}

let loopsStarted = false
/** district → last time we pushed a flood warning for it. */
const warnedAt: Record<string, number> = {}

export const useAppStore = create<AppState>((set, get) => {
  // ── engine helpers ─────────────────────────────────────────────────────────

  const refreshRecommendations = () => {
    const { stations, tide, mode } = get()
    // Manual mode is pure human control — the AI planner is off and proposes nothing.
    set({ recommendations: mode === 'manual' ? [] : recommend({ stations, tide }) })
  }

  const rebuildAreas = () => {
    const { stations, tide, activation } = get()
    set({ areas: buildAreas(stations, tide, (d) => activation[d] ?? 'idle') })
  }

  const execute = (stationId: string, action: RecAction, auto = false) => {
    const { stations, activityLog, cityRisk } = get()
    const st = stations.find((s) => s.id === stationId)
    if (!st || st.pumping || action === 'wait') return
    const verb = st.type === 'floodgate' ? 'เปิดประตูระบายน้ำ' : 'เริ่มสูบน้ำ'
    const next = stations.map((s) =>
      s.id === stationId ? { ...s, pumping: true, status: 'pumping' as const } : s,
    )
    const entry = log(`${auto ? '🤖 แผนที่อนุมัติแล้ว: ' : '✅ สั่งการโดยเจ้าหน้าที่: '}${verb} — ${st.name} (${st.capacity_cms} ลบ.ม./ว.)`)
    set({
      stations: next,
      activityLog: [entry, ...activityLog].slice(0, 60),
      narration: `🔻 ${st.name} กำลังระบายน้ำ · ความเสี่ยงเมืองอยู่ที่ ${cityRisk.toFixed(0)}% และกำลังลดลง`,
    })
  }

  /** Run a set of station ids, staggering by shared downstream node and skipping any
   *  station whose downstream has no headroom (anti-"move-the-flood-elsewhere"). */
  const executePlan = (ids: string[], auto = false) => {
    const { stations, tide } = get()
    const taken = new Set(stations.filter((s) => s.pumping).map((s) => s.downstream))
    const ranked = ids
      .map((id) => stations.find((s) => s.id === id))
      .filter((s): s is StationState => !!s && !s.pumping)
      .sort((a, b) => b.level + b.rain3h - (a.level + a.rain3h))
    for (const s of ranked) {
      if (taken.has(s.downstream)) continue
      if (!dischargeVerdict(s, get().stations, tide).ok) continue
      taken.add(s.downstream)
      execute(s.id, s.type === 'floodgate' ? 'open_gate' : 'pump', auto)
    }
  }

  const pushNotification = (n: Omit<Notification, 'id' | 'time'>) => {
    const noti: Notification = { ...n, id: uid('noti'), time: fmtTime(new Date()) }
    set((s) => ({ notifications: [noti, ...s.notifications].slice(0, 24) }))
    return noti.id
  }

  // ── alerting: fan a broadcast out to every phone in a zone ────────────────

  const upsertBroadcast = (b: Broadcast) =>
    set((s) => {
      const i = s.broadcasts.findIndex((x) => x.id === b.id)
      if (i === -1) return { broadcasts: [b, ...s.broadcasts].slice(0, 12) }
      const next = s.broadcasts.slice()
      next[i] = b
      return { broadcasts: next }
    })

  const runBroadcast = (
    district: string,
    severity: Severity,
    message: string,
    channels: Channel[] | undefined,
    existingId?: string,
  ) => {
    const { zones, online } = get()
    const zone = zones[district]
    if (!zone) return
    void sendAlert({
      district,
      severity,
      message,
      recipients: zone.recipients,
      reach: zoneReach(zone),
      channels,
      queuedOffline: !online,
      onUpdate: (b) => upsertBroadcast(existingId ? { ...b, id: existingId } : b),
    })
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
        // Drain must beat storm inflow (peaks ~2.2/tick) so an activated plan
        // pulls levels down even at the climax — the whole point of the demo.
        target -= 2.4 + s.capacity_cms / 30
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
      // Refresh the physical depth readings + the coded METAR line the AI ingests.
      next.laserDepth_m = laserDepth(next)
      next.freeboard_m = freeboard(next)
      next.metar = stationMetar(next, tide)
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
      patch.activityLog = [...logs, ...state.activityLog].slice(0, 60)
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
    rebuildAreas()

    const after = get()

    // ── continuous planning: keep running each area whose plan a human already
    //    APPROVED (activation === 'active'). There is no un-approved auto-dispatch:
    //    the system never fires a pump the operator didn't approve, and in manual
    //    mode nothing here runs at all.
    if (after.mode === 'heuristic') {
      for (const area of after.areas) {
        if (area.activation === 'active' && area.actionable > 0) {
          const ids = after.stations
            .filter((s) => s.district === area.district && !s.pumping)
            .map((s) => s.id)
          executePlan(ids, true)
        }
      }
    }

    // ── active notifications: warn about areas about to flood ─────────────────
    emitFloodWarnings()
    rebuildAreas()
  }

  /** Push a flood-soon warning for any un-handled area whose plan is idle, throttled per district. */
  const emitFloodWarnings = () => {
    const s = get()
    if (s.mode === 'manual') return // manual mode is hands-on — no AI plan notifications
    const now = Date.now()
    for (const area of s.areas) {
      const brewing = area.projected > 80 || area.maxLevel > 84 || area.atRisk > 0
      if (!brewing || area.activation !== 'idle' || area.actionable === 0) continue
      if (now - (warnedAt[area.district] ?? 0) < WARN_COOLDOWN_MS) continue
      // avoid duplicate open warning for the same district
      if (s.notifications.some((n) => n.kind === 'flood' && n.district === area.district)) continue
      warnedAt[area.district] = now
      const ids = s.stations
        .filter((x) => x.district === area.district && !x.pumping && dischargeVerdict(x, s.stations, s.tide).ok)
        .map((x) => x.id)
      pushNotification({
        kind: 'flood',
        district: area.district,
        title: `⚠️ เขต${area.district} เสี่ยงน้ำท่วมเร็ว ๆ นี้`,
        body: `ระดับน้ำสูงสุด ${area.maxLevel.toFixed(0)}% · คาดพุ่งถึง ~${area.projected.toFixed(0)}% ใน 3 ชม. · ${area.actionable} สถานีพร้อมระบาย. อนุมัติเพื่อเริ่มแผนระบายอัตโนมัติของเขตนี้`,
        stationIds: ids,
        riskReduction: Math.round(clamp((area.maxLevel - 60) * 0.2, 2, 16)),
      })
      set((st) => ({
        activityLog: [log(`⚠️ แจ้งเตือน: เขต${area.district} เข้าใกล้ระดับน้ำท่วม`, 'alert'), ...st.activityLog].slice(0, 60),
      }))
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
          next.laserDepth_m = laserDepth(next)
          next.freeboard_m = freeboard(next)
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
    areas: [],
    notifications: [],
    activation: {},
    activityLog: [],
    district: 'พระโขนง',
    mode: 'heuristic',
    narration: 'กำลังเชื่อมต่อแหล่งข้อมูล…',
    storm: false,
    stormT: 0,
    stormMinutes: 0,
    stormPhase: 'idle',
    feeds: { rain: 'sim', water: 'sim', tide: 'sim', stations: 'cached' },
    sources: {},
    zones: {},
    broadcasts: [],
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    a11yLarge: false,
    selectedStationId: null,
    plannerStationId: null,
    areaSort: 'risk',

    init: async () => {
      if (get().ready) return
      const stationsRes = await fetchStations()
      // Track A · LIVE — every source now arrives as a provenance-tagged Reading.
      const [rainR, tideR, waterR, pumpR] = await Promise.all([
        readRainfall(stationsRes.stations),
        readTideLevel(),
        readCanalRiverLevel(),
        readPumpGateStatus(),
      ])
      const rainRes = rainR.value
      const tideRes = tideR.value
      const waterRes = waterR.value
      const stations: StationState[] = stationsRes.stations.map((s) => {
        // real gauge level when available; otherwise a stable seeded starting level
        const level = waterRes.levels[s.id] ?? 40 + hash01(s.id) * 34
        const st: StationState = {
          ...s,
          level,
          targetLevel: level,
          trend: 0,
          pumping: false,
          status: 'ok',
          rain3h: rainRes.perStation[s.id] ?? 0,
          laserDepth_m: 0,
          freeboard_m: 0,
          metar: '',
        }
        st.status = statusOf(st)
        st.laserDepth_m = laserDepth(st)
        st.freeboard_m = freeboard(st)
        st.metar = stationMetar(st, tideRes)
        return st
      })
      const districts = [...new Set(stations.map((s) => s.district))]
      set({
        ready: true,
        stations,
        zones: buildZones(districts),
        canals: stationsRes.canals,
        gauges: waterRes.gauges,
        rain: rainRes,
        tide: tideRes,
        cityRisk: 0,
        targetRisk: computeTargetRisk(stations, next3hMm(rainRes.hours), tideRes),
        feeds: {
          rain: rainR.provenance,
          water: waterR.provenance,
          tide: tideR.provenance,
          stations: stationsRes.feed,
        },
        sources: { rainfall: rainR, tideLevel: tideR, canalRiverLevel: waterR, pumpGateStatus: pumpR },
        activityLog: [
          log(
            `ระบบออนไลน์ · ${stations.length} สถานีทั่วกรุงเทพฯ · ฝน: ${PROVENANCE_META[rainR.provenance].th} · น้ำ: ${PROVENANCE_META[waterR.provenance].th} · น้ำทะเล: ${PROVENANCE_META[tideR.provenance].th} · ปั๊ม/ประตู: ${PROVENANCE_META[pumpR.provenance].th}`,
            'system',
          ),
          ...backupWarningLogs([rainR, tideR, waterR, pumpR]),
        ],
      })
      refreshRecommendations()
      rebuildAreas()
      if (!loopsStarted) {
        loopsStarted = true
        requestAnimationFrame(frame)
        setInterval(simTick, SIM_TICK_MS)
        // Offline resilience: queued alerts are re-sent the moment we reconnect.
        if (typeof window !== 'undefined') {
          window.addEventListener('online', () => get().setOnline(true))
          window.addEventListener('offline', () => get().setOnline(false))
        }
        setInterval(async () => {
          const r = await readRainfall(get().stations)
          set((st) => ({
            rain: r.value,
            feeds: { ...st.feeds, rain: r.provenance },
            sources: { ...st.sources, rainfall: r },
          }))
        }, refreshIntervalOf('rainfall'))
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
    setAreaSort: (areaSort) => set({ areaSort }),
    setMode: (mode) => {
      set({ mode })
      set((s) => ({
        activityLog: [
          log(
            mode === 'manual'
              ? '🕹️ สลับเป็นโหมดควบคุมด้วยมือ — ปิดตัวช่วย AI ปั๊ม/ประตูทำงานเมื่อกดสั่งเท่านั้น (สำหรับซ่อมบำรุง/ทดสอบ/เซ็นเซอร์ผิดพลาด)'
              : '🤖 สลับเป็นโหมดฮิวริสติก (AI) — ระบบเสนอแผนระบายน้ำแบบประสานงาน เจ้าหน้าที่เป็นผู้อนุมัติทุกคำสั่ง',
            'system',
          ),
          ...s.activityLog,
        ].slice(0, 60),
      }))
      // Switching to manual clears any standing plan; switching back regenerates it.
      refreshRecommendations()
      rebuildAreas()
    },

    approve: (recId) => {
      const rec = get().recommendations.find((r) => r.id === recId)
      if (rec) execute(rec.stationId, rec.action)
      refreshRecommendations()
      rebuildAreas()
    },
    commandStation: (stationId) => {
      const st = get().stations.find((s) => s.id === stationId)
      execute(stationId, st?.type === 'floodgate' ? 'open_gate' : 'pump')
      refreshRecommendations()
      rebuildAreas()
    },
    stopStation: (stationId) => {
      const { stations, activityLog } = get()
      const st = stations.find((s) => s.id === stationId)
      if (!st || !st.pumping) return
      const next = stations.map((s) =>
        s.id === stationId ? { ...s, pumping: false, status: statusOf({ ...s, pumping: false }) } : s,
      )
      const verb = st.type === 'floodgate' ? 'ปิดประตูระบายน้ำ' : 'หยุดสูบน้ำ'
      set({
        stations: next,
        activityLog: [log(`⏹ สั่งการโดยเจ้าหน้าที่: ${verb} — ${st.name}`), ...activityLog].slice(0, 60),
      })
      refreshRecommendations()
      rebuildAreas()
    },
    selectStation: (stationId) => set({ selectedStationId: stationId }),
    openPlanner: (plannerStationId) => set({ plannerStationId }),

    activateArea: (district) => {
      const { mode, stations, tide } = get()
      // Manual mode has no AI area plans — ignore.
      if (mode === 'manual') return
      const ids = stations
        .filter((s) => s.district === district && !s.pumping && dischargeVerdict(s, stations, tide).ok)
        .map((s) => s.id)
      // Always human-approved: activating an area raises an approval request; the
      // plan only runs once the operator approves it (no un-approved auto-run).
      set((s) => ({ activation: { ...s.activation, [district]: 'pending' } }))
      pushNotification({
        kind: 'approval',
        district,
        title: `🔐 ขออนุมัติเปิดใช้งานแผน เขต${district}`,
        body: `แผนจะสั่งระบายน้ำ ${ids.length} สถานีในเขต${district} โดยจัดคิวตามโหนดปลายน้ำและรอบน้ำทะเล — อนุมัติเพื่อเริ่ม`,
        stationIds: ids,
        riskReduction: Math.round(clamp(ids.length * 1.5, 2, 18)),
      })
      rebuildAreas()
    },
    deactivateArea: (district) => {
      set((s) => ({ activation: { ...s.activation, [district]: 'idle' } }))
      set((s) => ({
        notifications: s.notifications.filter((n) => !(n.district === district && (n.kind === 'approval' || n.kind === 'flood'))),
        activityLog: [log(`⏸ หยุดแผนอัตโนมัติ เขต${district}`, 'system'), ...s.activityLog].slice(0, 60),
      }))
      rebuildAreas()
    },
    activateAllAreas: () => {
      const { areas } = get()
      const hot = areas.filter((a) => a.actionable > 0 || a.atRisk > 0)
      hot.forEach((a) => get().activateArea(a.district))
    },

    approveNotification: (id) => {
      const n = get().notifications.find((x) => x.id === id)
      if (!n) return
      if (n.district) {
        set((s) => ({ activation: { ...s.activation, [n.district as string]: 'active' } }))
        if (n.stationIds) executePlan(n.stationIds, true)
      }
      set((s) => ({
        notifications: s.notifications.filter((x) => x.id !== id),
        activityLog: [
          log(`✅ อนุมัติแผน${n.district ? ` เขต${n.district}` : ''} — เริ่มระบายน้ำอัตโนมัติ`),
          ...s.activityLog,
        ].slice(0, 60),
      }))
      pushNotification({
        kind: 'success',
        district: n.district,
        title: `▶️ เริ่มแผนแล้ว${n.district ? ` · เขต${n.district}` : ''}`,
        body: `กำลังระบายน้ำและเฝ้าติดตามอัตโนมัติจนกว่าระดับจะปลอดภัย`,
      })
      refreshRecommendations()
      rebuildAreas()
    },
    dismissNotification: (id) => {
      const n = get().notifications.find((x) => x.id === id)
      if (n?.kind === 'approval' && n.district) {
        set((s) => ({ activation: { ...s.activation, [n.district as string]: 'idle' } }))
      }
      set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }))
      rebuildAreas()
    },

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
        targetLevel: 40 + hash01(st.id) * 30,
        trend: 0,
      }))
      levels.forEach((st) => (st.status = statusOf(st)))
      Object.keys(warnedAt).forEach((k) => delete warnedAt[k])
      set({
        storm: false,
        stormT: 0,
        stormMinutes: 0,
        stormPhase: 'idle',
        stations: levels,
        recommendations: [],
        notifications: [],
        activation: {},
        broadcasts: [],
        narration: '↺ รีเซ็ตสถานการณ์แล้ว · ระบบกลับสู่การเฝ้าระวังปกติ',
        activityLog: [log('↺ รีเซ็ตสถานการณ์จำลอง', 'system'), ...s.activityLog].slice(0, 60),
      })
      refreshRecommendations()
      rebuildAreas()
    },

    broadcastAlert: (district, opts) => {
      const s = get()
      const risk = districtRisk(s, district)
      const severity = opts?.severity ?? severityFromRisk(risk)
      const draining = s.stations.some((st) => st.pumping && st.district === district)
      const message = opts?.message ?? draftMessage(severity, { district, tide: s.tide, draining })
      const channels = opts?.channels ?? SEVERITY_META[severity].channels
      const meta = SEVERITY_META[severity]
      const offline = !s.online
      set((st) => ({
        activityLog: [
          log(
            `${offline ? '📶 ออฟไลน์—เข้าคิว: ' : '📣 '}กระจายเตือน${meta.icon} เขต${district} (${meta.th}) → ${channels.length} ช่องทาง`,
            'alert',
          ),
          ...st.activityLog,
        ].slice(0, 60),
      }))
      runBroadcast(district, severity, message, channels)
    },

    broadcastAffected: () => {
      const s = get()
      const districts = [...new Set(s.stations.map((st) => st.district))]
      const affected = districts.filter((d) => severityFromRisk(districtRisk(s, d)) !== 'normal')
      if (!affected.length) {
        set((st) => ({
          activityLog: [log('📣 ไม่มีเขตที่ถึงเกณฑ์แจ้งเตือน — ยังไม่กระจายข้อความ', 'system'), ...st.activityLog].slice(0, 60),
        }))
        return
      }
      affected.forEach((d) => get().broadcastAlert(d))
    },

    setOnline: (online) => {
      const was = get().online
      set({ online })
      if (online && !was) {
        // Reconnected — flush every queued alert through the real fan-out.
        const queued = get().broadcasts.filter((b) => b.queued)
        if (queued.length) {
          set((st) => ({
            activityLog: [log(`🔌 กลับมาออนไลน์ — ส่งการแจ้งเตือนที่ค้างในคิว ${queued.length} รายการ`, 'system'), ...st.activityLog].slice(0, 60),
          }))
          queued.forEach((b) => runBroadcast(b.district, b.severity, b.message, b.channels, b.id))
        }
      } else if (!online && was) {
        set((st) => ({
          activityLog: [log('📵 การเชื่อมต่อหลุด — การแจ้งเตือนใหม่จะถูกเก็บเข้าคิวจนกว่าจะกลับมาออนไลน์', 'system'), ...st.activityLog].slice(0, 60),
        }))
      }
    },

    setA11yLarge: (a11yLarge) => set({ a11yLarge }),
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
