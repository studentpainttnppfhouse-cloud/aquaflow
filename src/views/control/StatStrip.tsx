import { useAppStore } from '../../store/useAppStore'
import { next3hMm } from '../../data/adapters/openMeteo'

export default function StatStrip() {
  const stations = useAppStore((s) => s.stations)
  const rain = useAppStore((s) => s.rain)
  const storm = useAppStore((s) => s.storm)
  const pumping = stations.filter((s) => s.pumping).length
  const avg = stations.length ? stations.reduce((a, s) => a + s.level, 0) / stations.length : 0
  const rain3h = storm ? 32 : next3hMm(rain.hours)

  const items = [
    { icon: '🏭', label: 'สถานีในระบบ', value: String(stations.length) },
    { icon: '💧', label: 'กำลังสูบ/ระบาย', value: String(pumping), hot: pumping > 0 },
    { icon: '📊', label: 'ระดับน้ำเฉลี่ย', value: `${avg.toFixed(0)}%` },
    { icon: '🌧️', label: 'ฝนคาดการณ์ 3 ชม.', value: `${rain3h.toFixed(1)} มม.`, hot: rain3h > 10 },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 border-b border-hud-edge bg-hud-bg px-2 py-2 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2.5 rounded-lg border border-hud-edge bg-hud-panel px-3 py-1.5">
          <span className="text-lg">{it.icon}</span>
          <div>
            <div className={`text-base font-extrabold leading-5 tabular-nums ${it.hot ? 'text-hud-cyan' : 'text-white'}`}>
              {it.value}
            </div>
            <div className="text-[10px] text-hud-dim">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
