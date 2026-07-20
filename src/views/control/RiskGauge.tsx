import { useAppStore } from '../../store/useAppStore'

/** City flood-risk gauge — the star element. The store eases cityRisk toward its target every frame, so the needle glides rather than jumps. */
export default function RiskGauge() {
  const risk = useAppStore((s) => s.cityRisk)
  const color = risk > 70 ? '#f87171' : risk > 40 ? '#fbbf24' : '#34d399'
  const label = risk > 70 ? 'เสี่ยงสูง' : risk > 40 ? 'เฝ้าระวัง' : 'ปกติ'
  // semicircle: angle -180° (0) → 0° (100)
  const angle = -180 + (Math.min(100, Math.max(0, risk)) / 100) * 180
  const arc = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return [100 + 78 * Math.cos(rad), 95 + 78 * Math.sin(rad)]
  }
  const [nx, ny] = arc(angle)
  return (
    <div className="rounded-xl border border-hud-edge bg-hud-panel p-3">
      <h2 className="text-sm font-bold text-white">🌡️ ความเสี่ยงน้ำท่วมทั้งเมือง</h2>
      <svg viewBox="0 0 200 110" className="mx-auto mt-1 block w-full max-w-[240px]">
        <path d="M 22 95 A 78 78 0 0 1 178 95" fill="none" stroke="#16283f" strokeWidth="12" strokeLinecap="round" />
        <path d="M 22 95 A 78 78 0 0 1 178 95" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(risk / 100) * 245} 245`} style={{ transition: 'stroke 300ms' }} />
        <line x1="100" y1="95" x2={nx} y2={ny} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="95" r="5" fill="#e2e8f0" />
        <text x="100" y="78" textAnchor="middle" fontSize="26" fontWeight="800" fill={color} className="tabular-nums">
          {risk.toFixed(0)}%
        </text>
      </svg>
      <div className="text-center text-xs font-bold" style={{ color }}>{label}</div>
    </div>
  )
}
