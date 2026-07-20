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
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">🚰 คลองและสถานีใกล้คุณ</h3>
        <LiveBadge feed={feeds.water} title="ThaiWater / สสน." />
      </div>
      <ul className="mt-2 space-y-2">
        {local.map((s) => (
          <li key={s.id} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate font-semibold text-slate-700">{s.canal}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {s.pumping && <span className="text-sky-500">💧 กำลังระบาย · </span>}
                {s.level.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s.pumping ? 'bg-sky-400' : s.level > 85 ? 'bg-rose-500' : s.level > 65 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, s.level)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {localGauges.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">สถานีวัดระดับน้ำอย่างเป็นทางการ</div>
          <ul className="mt-1 space-y-1 text-xs text-slate-600">
            {localGauges.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span className="truncate">{g.name}</span>
                <span className="tabular-nums">
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
