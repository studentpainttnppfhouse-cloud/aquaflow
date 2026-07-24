import { useAppStore } from '../../store/useAppStore'
import { drainSafety } from '../../engine/recommend'
import { clamp } from '../../lib/util'

const TYPE_LABEL = { pump: 'สถานีสูบน้ำ', floodgate: 'ประตูระบายน้ำ', tunnel: 'อุโมงค์ระบายน้ำ' } as const
const STATUS_LABEL = { ok: 'ปกติ', watch: 'เฝ้าระวัง', risk: 'เสี่ยงสูง', pumping: 'กำลังระบาย' } as const
const STATUS_TONE = {
  ok: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  watch: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  risk: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
  pumping: 'text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10',
} as const
const SAFETY_TONE = {
  ok: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  caution: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  hold: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
} as const

/**
 * Floating detail + per-station planner for the station last clicked on the map.
 * Renders as an overlay card anchored to the map (not a rail panel), with an
 * in-depth real-time read: projected level, drain-safety verdict ("is it OK to
 * push more water down from here right now?"), and the command action.
 */
export default function NodeDetail() {
  const station = useAppStore((s) => s.stations.find((st) => st.id === s.selectedStationId))
  const stations = useAppStore((s) => s.stations)
  const tide = useAppStore((s) => s.tide)
  const selectStation = useAppStore((s) => s.selectStation)
  const commandStation = useAppStore((s) => s.commandStation)

  if (!station) return null

  const safety = drainSafety(station, tide, stations)
  const projected = clamp(station.level + station.rain3h * 0.8, 0, 130)
  // Coarse time-to-risk from current fill trend (%/min); only meaningful when filling.
  const minsToRisk = station.trend > 0.2 ? Math.max(0, (85 - station.level) / station.trend) : null

  return (
    <div className="node-float pointer-events-auto absolute right-2 top-2 z-[1000] w-72 max-w-[calc(100%-1rem)]">
      <div className="glass-panel overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-hud-edge px-3 py-2">
          <div className="min-w-0">
            <div className="label-tech">📍 {TYPE_LABEL[station.type]} · เขต{station.district}</div>
            <div className="mt-0.5 truncate text-sm font-bold text-hud-text">{station.name}</div>
          </div>
          <button
            onClick={() => selectStation(null)}
            aria-label="ปิดรายละเอียดสถานี"
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-hud-dim transition hover:bg-white/10 hover:text-hud-text"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 p-3">
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[station.status]}`}>
              {STATUS_LABEL[station.status]}
            </span>
            <span className="data-value ml-auto text-hud-text">{station.level.toFixed(0)}%</span>
            <span className={station.trend > 0.5 ? 'text-hud-coral' : station.trend < -0.5 ? 'text-hud-cyan' : 'text-hud-dim'}>
              {station.trend > 0.5 ? '▲' : station.trend < -0.5 ? '▼' : '—'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${
                station.level > 85 ? 'bg-hud-coral' : station.level > 65 ? 'bg-hud-amber' : station.pumping ? 'bg-hud-cyan' : 'bg-hud-green'
              }`}
              style={{ width: `${Math.min(100, station.level)}%` }}
            />
          </div>

          {/* Per-station flood-risk verdict — safe to push more water down or not? */}
          <div className={`rounded-lg border px-2.5 py-1.5 ${SAFETY_TONE[safety.tone]}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>{safety.tone === 'ok' ? '✅' : safety.tone === 'caution' ? '⚠️' : '⛔'}</span>
              <span>เร่งระบายเพิ่ม: {safety.label}</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-hud-text/80">{safety.reason}</p>
          </div>

          <dl className="grid grid-cols-2 gap-1.5 text-xs">
            <Cell label="กำลังระบาย" value={`${station.capacity_cms} ลบ.ม./วิ`} />
            <Cell label="ฝนคาด 3 ชม." value={`${station.rain3h.toFixed(1)} มม.`} />
            <Cell label="ระดับคาดใน 3 ชม." value={`${projected.toFixed(0)}%`} tone={projected > 85 ? 'coral' : projected > 65 ? 'amber' : undefined} />
            <Cell label="ถึงระดับเสี่ยงใน" value={minsToRisk === null ? '—' : `~${Math.round(minsToRisk)} นาที`} tone={minsToRisk !== null && minsToRisk < 30 ? 'coral' : undefined} />
            <div className="col-span-2 rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
              <dt className="label-tech">คลอง → ปลายทาง</dt>
              <dd className="mt-0.5 truncate text-hud-text">{station.canal} → {station.downstream}</dd>
            </div>
          </dl>

          <button
            onClick={() => commandStation(station.id)}
            disabled={station.pumping || safety.tone === 'hold'}
            className="w-full rounded-lg bg-hud-cyan px-3 py-1.5 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
            title={safety.tone === 'hold' ? 'แม่น้ำเต็ม — ยังไม่ควรเร่งระบายจากจุดนี้' : undefined}
          >
            {station.pumping ? '💧 กำลังระบายน้ำ…' : station.type === 'floodgate' ? '🚪 เปิดประตูระบายน้ำ' : '💧 สั่งสูบน้ำ'}
          </button>
          {station.approx && <p className="text-[10px] text-hud-dim">พิกัดสถานีเป็นค่าโดยประมาณจากข้อมูลเปิด</p>}
        </div>
      </div>
    </div>
  )
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'coral' | 'amber' }) {
  const c = tone === 'coral' ? 'text-hud-coral' : tone === 'amber' ? 'text-hud-amber' : 'text-hud-text'
  return (
    <div className="rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
      <dt className="label-tech">{label}</dt>
      <dd className={`data-value mt-0.5 ${c}`}>{value}</dd>
    </div>
  )
}
