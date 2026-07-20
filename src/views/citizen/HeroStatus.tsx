import { districtRisk, useAppStore } from '../../store/useAppStore'

/** Hero status card — reads the same eased shared state as the control room, so an approved pumping action visibly relaxes this card red→green. */
export default function HeroStatus() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk(s, district))

  const band =
    risk > 70
      ? { label: 'เสี่ยงน้ำท่วม', icon: '🔴', bg: 'from-rose-500 to-red-600', desc: 'ระดับน้ำคลองใกล้คุณสูง โปรดเตรียมพร้อมและติดตามใกล้ชิด' }
      : risk > 40
        ? { label: 'เฝ้าระวัง', icon: '🟡', bg: 'from-amber-400 to-orange-500', desc: 'มีฝนหรือระดับน้ำสูงกว่าปกติในย่านของคุณ' }
        : { label: 'ปลอดภัย', icon: '🟢', bg: 'from-emerald-400 to-teal-500', desc: 'ระดับน้ำคลองรอบตัวคุณอยู่ในเกณฑ์ปกติ' }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${band.bg} p-4 text-white shadow-lg transition-colors duration-700`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-85">สถานะเขต{district} ตอนนี้</div>
          <div className="mt-0.5 text-2xl font-extrabold">
            {band.icon} {band.label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tabular-nums">{risk.toFixed(0)}%</div>
          <div className="text-[10px] opacity-85">ดัชนีความเสี่ยง</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
        <div className="h-full rounded-full bg-white/90" style={{ width: `${Math.min(100, risk)}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 opacity-95">{band.desc}</p>
    </div>
  )
}
