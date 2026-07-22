import { useAppStore } from '../../store/useAppStore'

/** Live system-status narration strip — one honest sentence about what the network is doing right now. */
export default function Narration() {
  const narration = useAppStore((s) => s.narration)
  return (
    <div
      key={narration}
      className="narration-enter flex items-center gap-2 border-b border-hud-edge bg-black/20 px-4 py-1.5 text-sm text-hud-cyan/95"
      role="status"
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-hud-cyan status-dot-live" aria-hidden />
      {narration}
    </div>
  )
}
