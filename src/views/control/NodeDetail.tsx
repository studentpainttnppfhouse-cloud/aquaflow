import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'

const TYPE_LABEL = { pump: 'สถานีสูบน้ำ', floodgate: 'ประตูระบายน้ำ', tunnel: 'อุโมงค์ระบายน้ำ' } as const
const STATUS_LABEL = { ok: 'ปกติ', watch: 'เฝ้าระวัง', risk: 'เสี่ยงสูง', pumping: 'กำลังระบาย' } as const
const STATUS_TONE = {
  ok: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  watch: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  risk: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
  pumping: 'text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10',
} as const

/** Docked detail for the station last clicked on the map — the "node detail" rail panel from the brief, in addition to the on-map popup. */
export default function NodeDetail() {
  const selectedId = useAppStore((s) => s.selectedStationId)
  const station = useAppStore((s) => s.stations.find((st) => st.id === s.selectedStationId))
  const selectStation = useAppStore((s) => s.selectStation)
  const commandStation = useAppStore((s) => s.commandStation)

  if (!selectedId || !station) return null

  return (
    <CollapsiblePanel
      id="node-detail"
      icon="📍"
      title="รายละเอียดสถานี"
      defaultOpen
      actions={
        <button
          onClick={(e) => {
            e.stopPropagation()
            selectStation(null)
          }}
          aria-label="ปิดรายละเอียดสถานี"
          className="grid h-5 w-5 place-items-center rounded-full text-hud-dim transition hover:bg-white/10 hover:text-hud-text"
        >
          ✕
        </button>
      }
    >
      <div className="label-tech">
        {TYPE_LABEL[station.type]} · เขต{station.district}
      </div>
      <div className="mt-0.5 text-sm font-bold text-hud-text">{station.name}</div>
      <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[station.status]}`}>
        {STATUS_LABEL[station.status]}
      </span>

      <div className="mt-3 flex items-center gap-2 text-xs">
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
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
          <dt className="label-tech">กำลังระบาย</dt>
          <dd className="data-value mt-0.5 text-hud-text">{station.capacity_cms} ลบ.ม./วิ</dd>
        </div>
        <div className="rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
          <dt className="label-tech">ฝนคาดการณ์ 3 ชม.</dt>
          <dd className="data-value mt-0.5 text-hud-text">{station.rain3h.toFixed(1)} มม.</dd>
        </div>
        <div className="col-span-2 rounded-lg border border-hud-edge bg-black/20 px-2 py-1.5">
          <dt className="label-tech">คลอง/ปลายทาง</dt>
          <dd className="mt-0.5 truncate text-hud-text">{station.canal}</dd>
        </div>
      </dl>
      {station.approx && <p className="mt-2 text-[10px] text-hud-dim">พิกัดสถานีเป็นค่าโดยประมาณจากข้อมูลเปิด</p>}

      <button
        onClick={() => commandStation(station.id)}
        disabled={station.pumping}
        className="mt-3 w-full rounded-lg bg-hud-cyan px-3 py-1.5 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
      >
        {station.pumping ? '💧 กำลังระบายน้ำ…' : station.type === 'floodgate' ? '🚪 เปิดประตูระบายน้ำ' : '💧 สั่งสูบน้ำ'}
      </button>
    </CollapsiblePanel>
  )
}
