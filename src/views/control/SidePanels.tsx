import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'
import CollapsiblePanel from '../../components/CollapsiblePanel'
import { next3hMm } from '../../data/adapters/openMeteo'
import type { StationState } from '../../data/types'

type SortKey = 'level' | 'risk' | 'capacity' | 'district'
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'level', label: 'ระดับน้ำ' },
  { id: 'risk', label: 'ความเสี่ยง' },
  { id: 'capacity', label: 'กำลังระบาย' },
  { id: 'district', label: 'เขต' },
]
const STATUS_RANK = { risk: 3, watch: 2, pumping: 1, ok: 0 } as const
const LIMIT = 60

function sortStations(stations: StationState[], key: SortKey): StationState[] {
  const arr = [...stations]
  switch (key) {
    case 'risk':
      return arr.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.level - a.level)
    case 'capacity':
      return arr.sort((a, b) => b.capacity_cms - a.capacity_cms)
    case 'district':
      return arr.sort((a, b) => a.district.localeCompare(b.district, 'th') || b.level - a.level)
    default:
      return arr.sort((a, b) => b.level - a.level)
  }
}

export function StationBars() {
  const stations = useAppStore((s) => s.stations)
  const [sort, setSort] = useState<SortKey>('risk')
  const sorted = sortStations(stations, sort)
  const shown = sorted.slice(0, LIMIT)
  return (
    <CollapsiblePanel
      id="station-levels"
      icon="📊"
      title="ระดับน้ำรายสถานี"
      defaultOpen={false}
      badge={
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-hud-dim">{stations.length}</span>
      }
      actions={
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          onClick={(e) => e.stopPropagation()}
          aria-label="เรียงลำดับสถานี"
          className="rounded-md border border-hud-edge bg-black/40 px-1.5 py-0.5 text-[11px] font-semibold text-hud-text outline-none focus:border-hud-cyan"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              เรียง: {s.label}
            </option>
          ))}
        </select>
      }
    >
      <ul className="space-y-1.5">
        {shown.map((s) => (
          <li key={s.id} className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-hud-text/85">{s.name.replace('สถานีสูบน้ำ', 'สน.').replace('ประตูระบายน้ำ', 'ปตร.')}</span>
              <span className="data-value shrink-0 text-hud-dim">
                {s.pumping ? '💧 ' : ''}
                {s.level.toFixed(0)}%
                <span className={s.trend > 0.5 ? 'text-hud-coral' : s.trend < -0.5 ? 'text-hud-cyan' : ''}>
                  {s.trend > 0.5 ? ' ▲' : s.trend < -0.5 ? ' ▼' : ''}
                </span>
              </span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  s.pumping ? 'bg-hud-cyan' : s.level > 85 ? 'bg-hud-coral' : s.level > 65 ? 'bg-hud-amber' : 'bg-hud-green'
                }`}
                style={{ width: `${Math.min(100, s.level)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > LIMIT && (
        <p className="mt-2 text-center text-[10px] text-hud-dim">
          แสดง {LIMIT} จาก {sorted.length} สถานี (เรียงตาม{SORTS.find((x) => x.id === sort)?.label})
        </p>
      )}
    </CollapsiblePanel>
  )
}

/** Rain-radar-style panel driven by the (real) forecast — decorative blobs sized by intensity plus an honest 12-h bar strip. */
export function RainRadar() {
  const rain = useAppStore((s) => s.rain)
  const storm = useAppStore((s) => s.storm)
  const feeds = useAppStore((s) => s.feeds)
  const mm3h = storm ? 32 : next3hMm(rain.hours)
  const nowIdx = Math.max(0, rain.hours.findIndex((h) => new Date(h.time).getTime() >= Date.now() - 3600e3))
  const next12 = rain.hours.slice(nowIdx, nowIdx + 12)
  const maxMm = Math.max(2, ...next12.map((h) => h.precipitation), storm ? 12 : 0)
  const intensity = Math.min(1, mm3h / 25)

  return (
    <CollapsiblePanel
      id="rainfall-radar"
      icon="🌧️"
      title="เรดาร์ฝน (จากพยากรณ์)"
      defaultOpen={false}
      actions={<LiveBadge feed={feeds.rain} title="Open-Meteo" />}
    >
      <div className="relative mx-auto mt-1 aspect-square w-28 overflow-hidden rounded-full border border-hud-edge bg-black/30">
        <div className="radar-sweep" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="radar-blob"
            style={{
              width: 28 + intensity * 46 + i * 8,
              height: 24 + intensity * 40 + i * 6,
              left: `${18 + i * 22}%`,
              top: `${20 + ((i * 27) % 40)}%`,
              background: `rgba(45,224,200,${0.12 + intensity * 0.4})`,
              animationDelay: `${i * 1.3}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="data-value text-lg font-extrabold text-hud-cyan">{mm3h.toFixed(0)}</div>
            <div className="text-[9px] text-hud-dim">มม. / 3 ชม.</div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex h-8 items-end gap-px" aria-label="ปริมาณฝนรายชั่วโมง 12 ชั่วโมงข้างหน้า">
        {next12.map((h) => (
          <div
            key={h.time}
            title={`${new Date(h.time).getHours()}:00 น. — ${h.precipitation.toFixed(1)} มม.`}
            className="flex-1 rounded-t-sm bg-hud-cyan/70"
            style={{ height: `${Math.max(4, (h.precipitation / maxMm) * 100)}%`, opacity: h.precipitation > 0.2 ? 1 : 0.25 }}
          />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-hud-dim">
        <span>ตอนนี้</span>
        <span>+12 ชม.</span>
      </div>
    </CollapsiblePanel>
  )
}

export function TideSpark() {
  const tide = useAppStore((s) => s.tide)
  const now = Date.now()
  const win = tide.series.filter((p) => p.t >= now - 6 * 3600e3 && p.t <= now + 18 * 3600e3)
  if (!win.length) return null
  const [lo, hi] = tide.range
  const x = (t: number) => ((t - win[0].t) / (win[win.length - 1].t - win[0].t)) * 240
  const y = (h: number) => 52 - ((h - lo) / Math.max(0.01, hi - lo)) * 44
  const path = win.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(' ')
  const nowPt = win.reduce((best, p) => (Math.abs(p.t - now) < Math.abs(best.t - now) ? p : best), win[0])
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="label-tech-lit">น้ำขึ้น–ลง เจ้าพระยา</h3>
        <LiveBadge feed={tide.source} title={tide.source === 'modeled' ? 'แบบจำลองฮาร์มอนิก (ติดป้ายชัดเจน)' : 'Open-Meteo Marine / WorldTides'} />
      </div>
      <svg viewBox="0 0 240 60" preserveAspectRatio="none" className="mt-1.5 h-20 w-full sm:h-24">
        <path d={path} fill="none" stroke="#2DE0C8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx={x(nowPt.t)} cy={y(nowPt.h)} r="3.5" fill="#2DE0C8" />
        <line x1={x(nowPt.t)} y1="0" x2={x(nowPt.t)} y2="60" stroke="#2DE0C8" strokeWidth="0.5" strokeDasharray="2 3" />
      </svg>
      <div className="flex justify-between text-[10px] text-hud-dim">
        <span>-6 ชม.</span>
        <span className="data-value font-bold text-hud-cyan">
          ตอนนี้ {tide.height.toFixed(2)} ม. {tide.phase === 'rising' ? '▲' : '▼'}
        </span>
        <span>+18 ชม.</span>
      </div>
    </div>
  )
}

export function ActivityLog() {
  const activityLog = useAppStore((s) => s.activityLog)
  const kindCls = { action: 'text-hud-cyan', system: 'text-hud-dim', alert: 'text-hud-amber' } as const
  return (
    <CollapsiblePanel id="activity-log" icon="📜" title="บันทึกการปฏิบัติการ" defaultOpen mobileDefaultOpen={false} className="lg:max-h-[16rem]">
      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs panel-scroll">
        {activityLog.length === 0 && <li className="p-2 text-hud-dim">ยังไม่มีเหตุการณ์</li>}
        {activityLog.map((e) => (
          <li key={e.id} className="flex gap-2">
            <span className="data-value shrink-0 text-hud-dim">{e.time}</span>
            <span className={kindCls[e.kind]}>{e.text}</span>
          </li>
        ))}
      </ul>
    </CollapsiblePanel>
  )
}
