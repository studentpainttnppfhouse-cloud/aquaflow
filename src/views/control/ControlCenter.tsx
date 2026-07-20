import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'
import MapPanel from './MapPanel'
import Narration from './Narration'
import RecommendationPanel from './RecommendationPanel'
import RiskGauge from './RiskGauge'
import StatStrip from './StatStrip'
import { ActivityLog, RainRadar, StationBars, TideSpark } from './SidePanels'
import { fmtClock } from '../../lib/util'

export default function ControlCenter() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <OpsBar />
      <Narration />
      <StatStrip />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:flex-row">
        <section className="order-2 flex min-h-0 w-full flex-col gap-2 lg:order-1 lg:w-[21rem]">
          <RecommendationPanel />
          <ActivityLog />
        </section>
        <section className="order-1 min-h-[45vh] flex-1 overflow-hidden rounded-xl border border-hud-edge lg:order-2 lg:min-h-0">
          <MapPanel />
        </section>
        <section className="order-3 flex w-full flex-col gap-2 overflow-y-auto panel-scroll lg:w-[19rem]">
          <RiskGauge />
          <TideSpark />
          <RainRadar />
          <StationBars />
        </section>
      </div>
    </div>
  )
}

function OpsBar() {
  const [now, setNow] = useState(new Date())
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hourIdx = rain.hours.findIndex((h) => new Date(h.time).getHours() === now.getHours())
  const nowRain = storm ? 18 : hourIdx >= 0 ? rain.hours[hourIdx].precipitation : 0
  const nowProb = storm ? 95 : hourIdx >= 0 ? rain.hours[hourIdx].probability : 0

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hud-edge bg-hud-panel/80 px-4 py-2 pr-56 backdrop-blur">
      <h1 className="text-lg font-extrabold tracking-tight text-white">
        🌊 Aqua<span className="text-hud-cyan">Flow</span>
        <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-widest text-hud-dim">
          Control Center · กทม.
        </span>
      </h1>
      <span className="font-mono text-sm tabular-nums text-hud-cyan">{fmtClock(now)}</span>

      <span className="flex items-center gap-1.5 rounded-full border border-hud-edge bg-black/25 px-2.5 py-1 text-xs">
        {storm ? '⛈️' : nowRain > 0.5 ? '🌧️' : '⛅'} ฝนตอนนี้ {nowRain.toFixed(1)} มม. · โอกาส {nowProb}%
        <LiveBadge feed={feeds.rain} title="Open-Meteo" />
      </span>
      <span className="flex items-center gap-1.5 rounded-full border border-hud-edge bg-black/25 px-2.5 py-1 text-xs">
        🌊 น้ำทะเล {tide.height.toFixed(2)} ม. {tide.phase === 'rising' ? '▲ ขึ้น' : '▼ ลง'}
        <LiveBadge feed={tide.source} title="ระดับน้ำทะเลอ่าวไทย" />
      </span>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-full border border-hud-edge bg-black/25 p-0.5 text-xs" role="group" aria-label="โหมดการทำงาน">
          <button
            onClick={() => setMode('confirm')}
            className={`rounded-full px-2.5 py-1 font-semibold ${mode === 'confirm' ? 'bg-hud-cyan text-slate-900' : 'text-hud-dim hover:text-hud-text'}`}
          >
            แนะนำ–ยืนยัน
          </button>
          <button
            onClick={() => setMode('semi')}
            className={`rounded-full px-2.5 py-1 font-semibold ${mode === 'semi' ? 'bg-hud-cyan text-slate-900' : 'text-hud-dim hover:text-hud-text'}`}
          >
            กึ่งอัตโนมัติ
          </button>
        </div>
        <button
          onClick={simulateStorm}
          disabled={storm}
          className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-40"
        >
          ⛈️ จำลองพายุฝน
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-hud-edge px-3 py-1 text-xs font-bold text-hud-dim hover:text-hud-text"
        >
          ↺ รีเซ็ต
        </button>
      </div>
    </header>
  )
}
