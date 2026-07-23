import { useAppStore } from '../../store/useAppStore'
import { dischargeVerdict, stationRisk } from '../../engine/risk'

const TYPE_LABEL = { pump: 'สถานีสูบน้ำ', floodgate: 'ประตูระบายน้ำ', tunnel: 'อุโมงค์ระบายน้ำ' } as const
const STATUS_LABEL = { ok: 'ปกติ', watch: 'เฝ้าระวัง', risk: 'เสี่ยงสูง', pumping: 'กำลังระบาย' } as const
const STATUS_TONE = {
  ok: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  watch: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  risk: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
  pumping: 'text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10',
} as const
const VERDICT_TONE = {
  green: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  amber: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  coral: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
} as const

/** Floating card that appears over the map when a station is clicked. */
export default function FloatingStationCard() {
  const station = useAppStore((s) => s.stations.find((st) => st.id === s.selectedStationId))
  const stations = useAppStore((s) => s.stations)
  const tide = useAppStore((s) => s.tide)
  const selectStation = useAppStore((s) => s.selectStation)
  const commandStation = useAppStore((s) => s.commandStation)
  const openPlanner = useAppStore((s) => s.openPlanner)

  if (!station) return null
  const verdict = dischargeVerdict(station, stations, tide)
  const risk = stationRisk(station)

  return (
    <div className="float-card pointer-events-auto absolute right-2 top-2 z-[600] w-[19rem] max-w-[calc(100%-1rem)] rounded-xl border border-hud-edgeStrong bg-hud-panelSolid/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="label-tech">
            {TYPE_LABEL[station.type]} · เขต{station.district}
          </div>
          <div className="mt-0.5 truncate text-sm font-bold text-hud-text">{station.name}</div>
        </div>
        <button
          onClick={() => selectStation(null)}
          aria-label="ปิด"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-hud-dim transition hover:bg-white/10 hover:text-hud-text"
        >
          ✕
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[station.status]}`}>
          {STATUS_LABEL[station.status]}
        </span>
        <span className="data-value text-[11px] text-hud-dim">
          ความเสี่ยง {risk.toFixed(0)}%
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-xs">
        <span className="text-hud-dim">ระดับน้ำ</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${
              station.level > 85 ? 'bg-hud-coral' : station.level > 65 ? 'bg-hud-amber' : station.pumping ? 'bg-hud-cyan' : 'bg-hud-green'
            }`}
            style={{ width: `${Math.min(100, station.level)}%` }}
          />
        </div>
        <span className="data-value text-hud-text">{station.level.toFixed(0)}%</span>
        <span className={station.trend > 0.5 ? 'text-hud-coral' : station.trend < -0.5 ? 'text-hud-cyan' : 'text-hud-dim'}>
          {station.trend > 0.5 ? '▲' : station.trend < -0.5 ? '▼' : '—'}
        </span>
      </div>

      {/* Answer to "is it OK to discharge more water down from here?" */}
      <div className={`mt-2.5 rounded-lg border px-2.5 py-1.5 text-[11px] leading-4 ${VERDICT_TONE[verdict.tone]}`}>
        <div className="flex items-center gap-1.5 font-bold">
          {verdict.ok ? '✅ ระบายน้ำเพิ่มได้' : '⛔ ยังไม่ควรระบายเพิ่ม'}
          <span className="ml-auto data-value opacity-80">ที่ว่างปลายน้ำ {verdict.headroom.toFixed(0)}%</span>
        </div>
        <p className="mt-1 opacity-90">{verdict.reason}</p>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
          <dt className="label-tech">กำลังระบาย</dt>
          <dd className="data-value mt-0.5 text-hud-text">{station.capacity_cms} ลบ.ม./วิ</dd>
        </div>
        <div className="rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
          <dt className="label-tech">ฝนคาด 3 ชม.</dt>
          <dd className="data-value mt-0.5 text-hud-text">{station.rain3h.toFixed(1)} มม.</dd>
        </div>
      </dl>

      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => commandStation(station.id)}
          disabled={station.pumping}
          className="flex-1 rounded-lg bg-hud-cyan px-3 py-1.5 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
        >
          {station.pumping ? '💧 กำลังระบาย…' : station.type === 'floodgate' ? '🚪 เปิดประตู' : '💧 สั่งสูบ'}
        </button>
        <button
          onClick={() => openPlanner(station.id)}
          className="rounded-lg border border-hud-edge px-3 py-1.5 text-sm font-semibold text-hud-text transition hover:border-hud-edgeStrong"
        >
          📋 แผนเฉพาะสถานี
        </button>
      </div>
      {station.approx && <p className="mt-1.5 text-[10px] text-hud-dim">พิกัดโดยประมาณจากข้อมูลเปิด</p>}
    </div>
  )
}
