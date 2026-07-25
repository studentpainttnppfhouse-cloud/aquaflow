import { useAppStore } from '../../store/useAppStore'
import { dischargeVerdict, nodeHeadroom, stationRisk } from '../../engine/risk'

const TYPE_LABEL = { pump: 'สถานีสูบน้ำ', floodgate: 'ประตูระบายน้ำ', tunnel: 'อุโมงค์ระบายน้ำ' } as const
const NODE_LABEL: Record<string, string> = {
  'CP-N': 'เจ้าพระยา (เหนือ)',
  'CP-C': 'เจ้าพระยา (กลาง)',
  'CP-S': 'เจ้าพระยา (ใต้)',
  'CP-W': 'เจ้าพระยา (ฝั่งธนฯ)',
  EAST: 'ออกด้านตะวันออก (ประเวศ/บางปะกง)',
}
const VERDICT_TONE = {
  green: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  amber: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10',
  coral: 'text-hud-coral border-hud-coral/40 bg-hud-coral/10',
} as const

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-hud-edge bg-black/25 px-2.5 py-2">
      <div className="label-tech">{label}</div>
      <div className="data-value mt-0.5 text-base font-bold text-hud-text">{value}</div>
      {sub && <div className="text-[10px] text-hud-dim">{sub}</div>}
    </div>
  )
}

/** In-depth, real-time planner for one station — the per-station planner option. */
export default function StationPlannerDrawer() {
  const id = useAppStore((s) => s.plannerStationId)
  const station = useAppStore((s) => s.stations.find((st) => st.id === s.plannerStationId))
  const stations = useAppStore((s) => s.stations)
  const tide = useAppStore((s) => s.tide)
  const openPlanner = useAppStore((s) => s.openPlanner)
  const commandStation = useAppStore((s) => s.commandStation)
  const selectStation = useAppStore((s) => s.selectStation)

  if (!id || !station) return null

  const verdict = dischargeVerdict(station, stations, tide)
  const risk = stationRisk(station)
  const projected = Math.min(140, station.level + station.rain3h * 0.8)
  const peers = stations.filter((s) => s.downstream === station.downstream)
  const peersPumping = peers.filter((s) => s.pumping).length
  const nodeHead = nodeHeadroom(station.downstream, stations, tide)
  // rough time-to-overflow at the current fill trend (minutes until 100%)
  const tto = station.trend > 0.3 ? (100 - station.level) / station.trend : Infinity

  return (
    <>
      <div className="fixed inset-0 z-[900] bg-black/50 backdrop-blur-sm" onClick={() => openPlanner(null)} />
      <aside className="fixed right-0 top-0 z-[901] flex h-full w-[min(26rem,100vw)] flex-col border-l border-hud-edgeStrong bg-hud-panelSolid shadow-2xl">
        <header className="flex items-start justify-between gap-2 border-b border-hud-edge px-4 py-3">
          <div className="min-w-0">
            <div className="label-tech">📋 แผนเฉพาะสถานี · เรียลไทม์</div>
            <h2 className="mt-0.5 truncate text-base font-bold text-hud-text">{station.name}</h2>
            <div className="text-[11px] text-hud-dim">
              {TYPE_LABEL[station.type]} · เขต{station.district}
            </div>
          </div>
          <button
            onClick={() => openPlanner(null)}
            aria-label="ปิด"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-hud-dim transition hover:bg-white/10 hover:text-hud-text"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto panel-scroll p-4">
          {/* discharge verdict — the key operational call */}
          <div className={`rounded-xl border px-3 py-2.5 ${VERDICT_TONE[verdict.tone]}`}>
            <div className="flex items-center gap-2 text-sm font-bold">
              {verdict.ok ? '✅ ปลอดภัยที่จะระบายน้ำเพิ่ม' : '⛔ ยังไม่ควรระบายน้ำเพิ่ม'}
              <span className="data-value ml-auto text-xs opacity-80">ที่ว่างปลายน้ำ {verdict.headroom.toFixed(0)}%</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 opacity-90">{verdict.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="ระดับน้ำปัจจุบัน" value={`${station.level.toFixed(0)}%`} sub={`แนวโน้ม ${station.trend > 0 ? '+' : ''}${station.trend.toFixed(1)} %/นาที`} />
            <Metric label="ความเสี่ยงสถานี" value={`${risk.toFixed(0)}%`} sub={station.status === 'risk' ? 'เสี่ยงสูง' : station.status === 'watch' ? 'เฝ้าระวัง' : 'ปกติ'} />
            <Metric label="คาดการณ์ 3 ชม." value={`${projected.toFixed(0)}%`} sub={`ฝน ${station.rain3h.toFixed(1)} มม.`} />
            <Metric
              label="เวลาถึงจุดล้น"
              value={Number.isFinite(tto) ? `~${tto.toFixed(0)} นาที` : 'ทรงตัว'}
              sub={station.pumping ? 'กำลังระบาย' : 'ยังไม่ระบาย'}
            />
          </div>

          {/* level bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-hud-dim">
              <span>ระดับน้ำเทียบความจุออกแบบ</span>
              <span className="data-value">{station.level.toFixed(0)}% · คาด {projected.toFixed(0)}%</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${station.level > 85 ? 'bg-hud-coral' : station.level > 65 ? 'bg-hud-amber' : station.pumping ? 'bg-hud-cyan' : 'bg-hud-green'}`}
                style={{ width: `${Math.min(100, station.level)}%` }}
              />
              <div className="absolute top-0 h-full w-[2px] bg-white/70" style={{ left: `${Math.min(100, projected)}%` }} title="คาดการณ์ 3 ชม." />
            </div>
          </div>

          {/* downstream node — where this station's water goes */}
          <div className="rounded-xl border border-hud-edge bg-black/20 p-3">
            <div className="label-tech">ปลายทางการระบาย (โหนด {station.downstream})</div>
            <div className="mt-1 text-sm font-semibold text-hud-text">{NODE_LABEL[station.downstream] ?? station.downstream}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-hud-dim">ที่ว่างรับน้ำ</span>
                <div className="data-value font-bold text-hud-text">{nodeHead.toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-hud-dim">สถานีที่ใช้โหนดนี้</span>
                <div className="data-value font-bold text-hud-text">
                  {peers.length} จุด · ระบายอยู่ {peersPumping}
                </div>
              </div>
            </div>
            {station.downstream.startsWith('CP') && (
              <div className="mt-2 text-[11px] text-hud-dim">
                น้ำทะเลเจ้าพระยา {tide.height.toFixed(2)} ม. {tide.phase === 'rising' ? '▲ กำลังขึ้น' : '▼ กำลังลง'} —{' '}
                {tide.phase === 'falling' ? 'เหมาะแก่การสูบลงแม่น้ำ' : 'แม่น้ำรับน้ำได้จำกัด'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="กำลังระบาย" value={`${station.capacity_cms}`} sub="ลบ.ม./วินาที" />
            <Metric label="คลอง/สาย" value={station.canal.replace('คลอง', '')} sub={station.canal.startsWith('คลอง') ? 'คลอง' : ''} />
          </div>
        </div>

        <footer className="flex gap-2 border-t border-hud-edge p-4">
          <button
            onClick={() => commandStation(station.id)}
            disabled={station.pumping}
            className="flex-1 rounded-lg bg-hud-cyan px-3 py-2 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
          >
            {station.pumping ? '💧 กำลังระบายน้ำ…' : station.type === 'floodgate' ? '🚪 เปิดประตูระบายน้ำ' : '💧 สั่งสูบน้ำเดี๋ยวนี้'}
          </button>
          <button
            onClick={() => {
              selectStation(station.id)
              openPlanner(null)
            }}
            className="rounded-lg border border-hud-edge px-3 py-2 text-sm font-semibold text-hud-text transition hover:border-hud-edgeStrong"
          >
            📍 บนแผนที่
          </button>
        </footer>
      </aside>
    </>
  )
}
