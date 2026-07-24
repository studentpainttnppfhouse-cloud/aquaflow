import { useEffect, useRef, useState } from 'react'
import type L from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'
import MapPanel from './MapPanel'
import Narration from './Narration'
import RecommendationPanel from './RecommendationPanel'
import NodeDetail from './NodeDetail'
import GaugeCluster from './GaugeCluster'
import StatStrip from './StatStrip'
import Footer from './Footer'
import EmergencyBroadcast from './EmergencyBroadcast'
import { ActivityLog, RainRadar, StationBars } from './SidePanels'
import { fmtClock } from '../../lib/util'

export default function ControlCenter() {
  const mapRef = useRef<L.Map>(null)

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-hud-bg to-hud-bg2">
      <TopStatusBar />
      <ConditionsBar />
      <Narration />
      <StatStrip />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:flex-row lg:overflow-hidden">
        <section className="order-2 flex min-h-0 w-full flex-col gap-2 lg:order-1 lg:w-[18.5rem] lg:overflow-y-auto lg:panel-scroll">
          <RecommendationPanel />
          <ActivityLog />
          <RainRadar />
          <StationBars />
        </section>
        <section className="glass-panel relative order-1 min-h-[52vh] flex-1 overflow-hidden lg:order-2 lg:min-h-0">
          <MapPanel mapRef={mapRef} />
          <NodeDetail />
        </section>
      </div>
      <div className="shrink-0 px-2 pt-0">
        <EmergencyBroadcast />
      </div>
      <div className="shrink-0 px-2 pb-2 pt-2">
        <GaugeCluster />
      </div>
      <Footer mapRef={mapRef} />
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
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-hud-edge bg-hud-panelSolid/90 px-4 py-2.5 pr-24 backdrop-blur sm:pr-56">
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

const MODES: { id: 'manual' | 'heuristic' | 'auto'; label: string; hint: string }[] = [
  { id: 'manual', label: '🕹️ Manual', hint: 'ควบคุมด้วยมือทุกจุด' },
  { id: 'heuristic', label: '🧠 Heuristic v1', hint: 'AI เสนอแผน · เจ้าหน้าที่อนุมัติ' },
  { id: 'auto', label: '🤖 AI Auto', hint: 'AI สั่งการ + ประกาศอัตโนมัติ' },
]

function ConditionsBar() {
  const { rain, tide, storm, stormPhase, stormMinutes, feeds, mode } = useAppStore((s) => ({
    rain: s.rain,
    tide: s.tide,
    storm: s.storm,
    stormPhase: s.stormPhase,
    stormMinutes: s.stormMinutes,
    feeds: s.feeds,
    mode: s.mode,
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
  const nowRain = hourIdx >= 0 ? rain.hours[hourIdx].precipitation : 0
  const nowProb = hourIdx >= 0 ? rain.hours[hourIdx].probability : 0
  const stormPct = Math.round((stormMinutes / 180) * 100)
  const phaseTxt =
    stormPhase === 'building'
      ? 'ฝนเริ่มตก'
      : stormPhase === 'peak'
        ? 'ฝนตกหนักสุด'
        : stormPhase === 'receding'
          ? 'ฝนเริ่มซา'
          : stormPhase === 'clearing'
            ? 'ฝนใกล้หยุด'
            : ''

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hud-edge bg-black/10 px-3 py-1.5">
      <span className="status-pill">
        {storm ? '⛈️' : nowRain > 0.5 ? '🌧️' : '⛅'}
        {storm ? (
          <span>
            ไทม์แลปส์พายุ <span className="data-value">{(stormMinutes / 60).toFixed(1)}</span>/3.0 ชม. · {phaseTxt}
          </span>
        ) : (
          <span>
            ฝนตอนนี้ <span className="data-value">{nowRain.toFixed(1)}</span> มม. · โอกาส <span className="data-value">{nowProb}</span>%
          </span>
        )}
        <LiveBadge feed={feeds.rain} title="Open-Meteo" />
      </span>
      <span className="status-pill">
        🌊
        <span>
          น้ำทะเล <span className="data-value">{tide.height.toFixed(2)}</span> ม. {tide.phase === 'rising' ? '▲ ขึ้น' : '▼ ลง'}
        </span>
        <LiveBadge feed={tide.source} title="ระดับน้ำทะเลอ่าวไทย" />
      </span>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="flex rounded-full border border-hud-edge bg-black/25 p-0.5 text-[11px]"
          role="group"
          aria-label="โหมดการทำงาน"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.hint}
              aria-pressed={mode === m.id}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                mode === m.id
                  ? m.id === 'auto'
                    ? 'bg-hud-cyan text-slate-900'
                    : 'bg-white/15 text-hud-text'
                  : 'text-hud-dim hover:text-hud-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={simulateStorm}
          disabled={storm}
          className="relative overflow-hidden rounded-full border border-hud-coral/40 bg-hud-coral/10 px-3 py-1 text-xs font-bold text-hud-coral transition hover:bg-hud-coral/25 disabled:cursor-not-allowed"
          title="จำลองพายุฝน 3 ชั่วโมงแบบไทม์แลปส์ (ฝนจะซาและหยุดเองเมื่อครบเวลา)"
        >
          {storm && (
            <span
              className="absolute inset-y-0 left-0 bg-hud-coral/25 transition-[width] duration-500 ease-out"
              style={{ width: `${stormPct}%` }}
              aria-hidden
            />
          )}
          <span className="relative">{storm ? `⛈️ พายุกำลังผ่าน ${stormPct}%` : '⛈️ จำลองพายุฝน (3 ชม.)'}</span>
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
