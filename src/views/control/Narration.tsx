import { useAppStore } from '../../store/useAppStore'

/** Live system-status narration strip — one honest sentence about what the network is doing right now. */
export default function Narration() {
  const narration = useAppStore((s) => s.narration)
  return (
    <div
      key={narration}
      className="narration-enter border-b border-hud-edge bg-gradient-to-r from-hud-panel via-[#0a1c2e] to-hud-panel px-4 py-1.5 text-sm text-hud-cyan/95"
      role="status"
      aria-live="polite"
    >
      {narration}
    </div>
  )
}
