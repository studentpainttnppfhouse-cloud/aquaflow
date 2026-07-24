import { useCallback, useEffect, useRef, useState } from 'react'
import type L from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'
import MapPanel from './MapPanel'
import Narration from './Narration'
import RecommendationPanel from './RecommendationPanel'
import AreaPanel from './AreaPanel'
import ModelCard from './ModelCard'
import NotificationPanel from './NotificationPanel'
import StationPlannerDrawer from './StationPlannerDrawer'
import GaugeCluster from './GaugeCluster'
import StatStrip from './StatStrip'
import Footer from './Footer'
import BroadcastPanel from './BroadcastPanel'
import { ActivityLog, RainRadar, StationBars } from './SidePanels'
import { fmtClock } from '../../lib/util'

const RAIL_KEY = 'aquaflow.railWidth'
const RAIL_MIN = 240
const RAIL_MAX = 560
const RAIL_DEFAULT = 336 // 21rem

function useRailWidth() {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return RAIL_DEFAULT
    const stored = Number(window.sessionStorage.getItem(RAIL_KEY))
    return Number.isFinite(stored) && stored >= RAIL_MIN ? stored : RAIL_DEFAULT
  })
  useEffect(() => {
    window.sessionStorage.setItem(RAIL_KEY, String(Math.round(width)))
  }, [width])
  return [width, setWidth] as const
}

export default function ControlCenter() {
  const mapRef = useRef<L.Map>(null)
  const [railW, setRailW] = useRailWidth()
  const mode = useAppStore((s) => s.mode)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-gradient-to-b from-hud-bg to-hud-bg2 lg:overflow-hidden">
      <TopStatusBar />
      <ConditionsBar />
      <Narration />
      <StatStrip />
      <div className="flex min-h-0 flex-col gap-2 p-2 lg:flex-1 lg:flex-row lg:gap-0 lg:overflow-hidden">
        {/* Left rail — plan / manual console + areas (resizable width) */}
        <section
          style={{ '--rail-w': `${railW}px` } as React.CSSProperties}
          className="order-2 flex min-h-0 w-full shrink-0 flex-col gap-2 lg:order-1 lg:w-[var(--rail-w)] lg:overflow-y-auto lg:pr-2 lg:panel-scroll"
        >
          <RecommendationPanel />
          {mode === 'heuristic' && <AreaPanel />}
          <ModelCard />
          <ActivityLog />
        </section>

        <RailDivider width={railW} onResize={setRailW} />

        {/* Center — map with glowing river + floating station detail */}
        <section className="glass-panel order-1 min-h-[45vh] flex-1 overflow-hidden lg:order-2 lg:min-h-0">
          <MapPanel mapRef={mapRef} />
        </section>

        {/* Right rail — notifications/approvals, multi-channel alerting, radar, water level */}
        <section className="order-3 flex min-h-0 w-full shrink-0 flex-col gap-2 lg:ml-2 lg:w-[20rem] lg:overflow-y-auto lg:panel-scroll">
          <NotificationPanel />
          <BroadcastPanel />
          <RainRadar />
          <StationBars />
        </section>
      </div>
      <div className="shrink-0 px-2 pb-2">
        <GaugeCluster />
      </div>
      <Footer mapRef={mapRef} />
      <StationPlannerDrawer />
    </div>
  )
}

/** Draggable vertical divider between the left rail and the map (desktop only). */
function RailDivider({ width, onResize }: { width: number; onResize: (w: number) => void }) {
  const start = useRef<{ x: number; w: number } | null>(null)
  const onDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      start.current = { x: e.clientX, w: width }
      const move = (ev: PointerEvent) => {
        if (!start.current) return
        const next = Math.max(RAIL_MIN, Math.min(RAIL_MAX, start.current.w + (ev.clientX - start.current.x)))
        onResize(next)
      }
      const up = () => {
        start.current = null
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        document.body.style.userSelect = ''
      }
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [width, onResize],
  )
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="ปรับความกว้างแผงข้าง (ดับเบิลคลิกเพื่อรีเซ็ต)"
      onPointerDown={onDown}
      onDoubleClick={() => onResize(RAIL_DEFAULT)}
      title="ลากเพื่อปรับความกว้างแผงข้าง · ดับเบิลคลิกเพื่อรีเซ็ต"
      className="group relative z-[10] hidden w-2 shrink-0 cursor-ew-resize touch-none items-stretch lg:flex"
    >
      <span className="mx-auto my-2 w-0.5 rounded-full bg-hud-edgeStrong/60 transition group-hover:bg-hud-cyan/70" aria-hidden />
    </div>
  )
}

function TopStatusBar() {
  const [now, setNow] = useState(new Date())
  const feeds = useAppStore((s) => s.feeds)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const anyLive = Object.values(feeds).some((f) => f === 'live')

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-hud-edge bg-hud-panelSolid/90 px-3 py-2.5 pr-16 backdrop-blur sm:px-4 sm:pr-56">
      <h1 className="flex w-full items-center gap-2 text-lg font-extrabold tracking-tight text-hud-text sm:w-auto">
        🌊 Aqua<span className="text-hud-cyan">Flow</span>
        <span className="label-tech hidden sm:inline">Control Center · กทม.</span>
      </h1>

      <span className="status-pill">
        <span className={`h-1.5 w-1.5 rounded-full ${anyLive ? 'bg-hud-cyan status-dot-live' : 'bg-hud-amber'}`} aria-hidden />
        <span className="label-tech-lit !text-[10px]">{anyLive ? 'SYSTEM ONLINE' : 'CACHED MODE'}</span>
      </span>

      <span className="data-value text-sm text-hud-cyan">{fmtClock(now)}</span>

      <div className="ml-auto flex items-center gap-1.5 rounded-full border border-hud-edge bg-black/20 py-1 pl-1 pr-2.5">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-hud-cyan/20 text-[10px] font-bold text-hud-cyan">
          O
        </span>
        <span className="label-tech !text-hud-text">เจ้าหน้าที่ควบคุม</span>
      </div>
    </header>
  )
}

function ConditionsBar() {
  const { rain, tide, storm, mode, feeds } = useAppStore((s) => ({
    rain: s.rain,
    tide: s.tide,
    storm: s.storm,
    mode: s.mode,
    feeds: s.feeds,
  }))
  const setMode = useAppStore((s) => s.setMode)
  const simulateStorm = useAppStore((s) => s.simulateStorm)
  const reset = useAppStore((s) => s.reset)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const hourIdx = rain.hours.findIndex((h) => new Date(h.time).getHours() === now.getHours())
  const nowRain = storm ? 18 : hourIdx >= 0 ? rain.hours[hourIdx].precipitation : 0
  const nowProb = storm ? 95 : hourIdx >= 0 ? rain.hours[hourIdx].probability : 0

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hud-edge bg-black/10 px-3 py-1.5">
      <span className="status-pill">
        {storm ? '⛈️' : nowRain > 0.5 ? '🌧️' : '⛅'}
        <span>
          ฝนตอนนี้ <span className="data-value">{nowRain.toFixed(1)}</span> มม. · โอกาส <span className="data-value">{nowProb}</span>%
        </span>
        <LiveBadge feed={feeds.rain} title="Open-Meteo" />
      </span>
      <span className="status-pill">
        🌊
        <span>
          น้ำทะเล <span className="data-value">{tide.height.toFixed(2)}</span> ม. {tide.phase === 'rising' ? '▲ ขึ้น' : '▼ ลง'}
        </span>
        <LiveBadge feed={feeds.tide} title="ระดับน้ำทะเลอ่าวไทย" />
      </span>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {/* Two operating modes — the AI never fires a pump on its own. */}
        <div className="flex rounded-full border border-hud-edge bg-black/25 p-0.5 text-xs" role="group" aria-label="โหมดการทำงาน">
          <button
            onClick={() => setMode('manual')}
            aria-pressed={mode === 'manual'}
            title="ควบคุมด้วยมือ — ปั๊ม/ประตูทำงานเมื่อกดสั่งเท่านั้น (ซ่อมบำรุง/ทดสอบ/เซ็นเซอร์ผิดพลาด)"
            className={`rounded-full px-2.5 py-1 font-semibold transition ${mode === 'manual' ? 'bg-hud-amber text-slate-900' : 'text-hud-dim hover:text-hud-text'}`}
          >
            🕹️ Manual
          </button>
          <button
            onClick={() => setMode('heuristic')}
            aria-pressed={mode === 'heuristic'}
            title="ฮิวริสติก (AI) — ระบบเสนอแผนประสานงาน เจ้าหน้าที่เป็นผู้อนุมัติทุกคำสั่ง"
            className={`rounded-full px-2.5 py-1 font-semibold transition ${mode === 'heuristic' ? 'bg-hud-cyan text-slate-900' : 'text-hud-dim hover:text-hud-text'}`}
          >
            🤖 Heuristic
          </button>
        </div>
        <button
          onClick={simulateStorm}
          disabled={storm}
          className="rounded-full border border-hud-coral/40 bg-hud-coral/10 px-3 py-1 text-xs font-bold text-hud-coral transition hover:bg-hud-coral/25 disabled:opacity-40"
        >
          ⛈️ จำลองพายุฝน
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-hud-edge px-3 py-1 text-xs font-bold text-hud-dim transition hover:text-hud-text"
        >
          ↺ รีเซ็ต
        </button>
      </div>
    </div>
  )
}
