import { districtRisk, useAppStore } from '../../store/useAppStore'

/** Hero status card — reads the same eased shared state as the control room, so an approved pumping action visibly relaxes this card red→green. */
export default function HeroStatus() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk(s, district))

  const band =
    risk > 70
      ? {
          label: 'เสี่ยงน้ำท่วม',
          icon: '🔴',
          tone: 'from-hud-coral/25 to-hud-coral/5 border-hud-coral/40',
          text: 'text-hud-coral',
          fill: 'bg-hud-coral',
          desc: 'ระดับน้ำคลองใกล้คุณสูง โปรดเตรียมพร้อมและติดตามใกล้ชิด',
        }
      : risk > 40
        ? {
            label: 'เฝ้าระวัง',
            icon: '🟡',
            tone: 'from-hud-amber/25 to-hud-amber/5 border-hud-amber/40',
            text: 'text-hud-amber',
            fill: 'bg-hud-amber',
            desc: 'มีฝนหรือระดับน้ำสูงกว่าปกติในย่านของคุณ',
          }
        : {
            label: 'ปลอดภัย',
            icon: '🟢',
            tone: 'from-hud-green/25 to-hud-green/5 border-hud-green/40',
            text: 'text-hud-green',
            fill: 'bg-hud-green',
            desc: 'ระดับน้ำคลองรอบตัวคุณอยู่ในเกณฑ์ปกติ',
          }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${band.tone} p-4 text-hud-text shadow-lg backdrop-blur-md transition-colors duration-700`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="label-tech">สถานะเขต{district} ตอนนี้</div>
          <div className={`mt-1 text-2xl font-extrabold ${band.text}`}>
            {band.icon} {band.label}
          </div>
        </div>
        <div className="text-right">
          <div className={`data-value text-3xl font-extrabold ${band.text}`}>{risk.toFixed(0)}%</div>
          <div className="label-tech mt-0.5">ดัชนีความเสี่ยง</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
        <div className={`h-full rounded-full ${band.fill}`} style={{ width: `${Math.min(100, risk)}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-hud-text/85">{band.desc}</p>
    </div>
  )
}
