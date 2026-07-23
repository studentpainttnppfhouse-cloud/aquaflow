import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'

/** Nearby infrastructure + official gauge readings for the selected district. */
export default function CanalList() {
  const district = useAppStore((s) => s.district)
  const stations = useAppStore((s) => s.stations)
  const gauges = useAppStore((s) => s.gauges)
  const feeds = useAppStore((s) => s.feeds)

  const local = stations
    .filter((s) => s.district === district)
    .concat(stations.filter((s) => s.district !== district).slice(0, 2))
    .slice(0, 4)
  const localGauges = gauges.filter((g) => g.district === district).slice(0, 2)

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-hud-text">🚰 คลองและสถานีใกล้คุณ</h3>
        <LiveBadge feed={feeds.water} title="ThaiWater / สสน." />
      </div>
      <ul className="mt-2 space-y-2">
        {local.map((s) => (
          <li key={s.id} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate font-semibold text-hud-text/85">{s.canal}</span>
              <span className="data-value shrink-0 text-hud-dim">
                {s.pumping && <span className="text-hud-cyan">💧 กำลังระบาย · </span>}
                {s.level.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s.pumping ? 'bg-hud-cyan' : s.level > 85 ? 'bg-hud-coral' : s.level > 65 ? 'bg-hud-amber' : 'bg-hud-green'
                }`}
                style={{ width: `${Math.min(100, s.level)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {localGauges.length > 0 && (
        <div className="mt-3 border-t border-hud-edge pt-2">
          <div className="label-tech">สถานีวัดระดับน้ำอย่างเป็นทางการ</div>
          <ul className="mt-1 space-y-1 text-xs text-hud-text/80">
            {localGauges.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span className="truncate">{g.name}</span>
                <span className="data-value">
                  {g.waterlevel_m.toFixed(2)} / ตลิ่ง {g.bank_m.toFixed(2)} ม.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
