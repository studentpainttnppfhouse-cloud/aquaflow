type GaugeTone = 'cyan' | 'green' | 'amber' | 'coral'

const FILL: Record<GaugeTone, string> = {
  cyan: 'bg-hud-cyan shadow-[0_0_10px_rgba(45,224,200,0.55)]',
  green: 'bg-hud-green',
  amber: 'bg-hud-amber',
  coral: 'bg-hud-coral shadow-[0_0_10px_rgba(255,107,74,0.55)]',
}
const TEXT: Record<GaugeTone, string> = {
  cyan: 'text-hud-cyan',
  green: 'text-hud-green',
  amber: 'text-hud-amber',
  coral: 'text-hud-coral',
}

/** Vertical fill-bar gauge — sensor-style numeric readout over a bordered fill track. */
export default function GaugeBar({
  label,
  value,
  unit,
  pct,
  tone,
  sub,
}: {
  label: string
  value: string
  unit?: string
  /** 0–100 fill height */
  pct: number
  tone: GaugeTone
  sub?: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-9 overflow-hidden rounded-md border border-hud-edge bg-black/25">
        <div
          className={`absolute inset-x-0 bottom-0 rounded-b-[5px] transition-[height] duration-700 ease-out-expo ${FILL[tone]}`}
          style={{ height: `${clamped}%` }}
        />
        {[25, 50, 75].map((tick) => (
          <div key={tick} className="absolute inset-x-0 border-t border-black/30" style={{ bottom: `${tick}%` }} />
        ))}
      </div>
      <div className="text-center">
        <div className={`data-value text-base font-bold leading-none ${TEXT[tone]}`}>
          {value}
          {unit && <span className="ml-0.5 text-[10px] font-sans font-semibold text-hud-dim">{unit}</span>}
        </div>
        <div className="label-tech mt-1.5">{label}</div>
        {sub && <div className="mt-0.5 text-[10px] text-hud-dim">{sub}</div>}
      </div>
    </div>
  )
}
