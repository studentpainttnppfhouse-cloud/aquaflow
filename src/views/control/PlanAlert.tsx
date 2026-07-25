import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

// How long an unattended notification stays before it fades on its own.
// The staff can let it lapse (keep watching) or approve the network-wide drain.
const LIFETIME_MS = 13_000

/**
 * AI-moderated plan notification, overlaid on the main center (the map). In
 * heuristic mode the engine raises one of these when a coordinated drain is
 * worth running; it counts down and self-clears if the operator does nothing,
 * so the screen never stays cluttered. One tap approves and drains the whole
 * network at once; the operator can also close it to keep watching manually.
 */
export default function PlanAlert() {
  const alert = useAppStore((s) => s.planAlert)
  const equalizeNetwork = useAppStore((s) => s.equalizeNetwork)
  const dismissPlanAlert = useAppStore((s) => s.dismissPlanAlert)
  const [remaining, setRemaining] = useState(LIFETIME_MS)

  const alertId = alert?.id
  useEffect(() => {
    if (!alertId) return
    const start = Date.now()
    setRemaining(LIFETIME_MS)
    const iv = window.setInterval(() => {
      const left = LIFETIME_MS - (Date.now() - start)
      if (left <= 0) {
        window.clearInterval(iv)
        dismissPlanAlert()
      } else {
        setRemaining(left)
      }
    }, 100)
    return () => window.clearInterval(iv)
  }, [alertId, dismissPlanAlert])

  if (!alert) return null

  const pct = Math.max(0, Math.min(100, (remaining / LIFETIME_MS) * 100))
  const secs = Math.max(0, Math.ceil(remaining / 1000))
  const count = Math.max(alert.drainable, alert.actionable)

  const approve = () => {
    equalizeNetwork()
    dismissPlanAlert()
  }

  return (
    <div className="plan-alert pointer-events-auto absolute inset-x-2 bottom-2 z-[1000] mx-auto max-w-md sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <div className="glass-panel overflow-hidden border-hud-cyan/40 shadow-2xl">
        {/* countdown — the alert leaves the screen when this runs out */}
        <div className="h-0.5 w-full bg-black/40">
          <div className="h-full bg-hud-cyan transition-[width] duration-100 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-start gap-2.5 p-3">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-hud-cyan/15 text-sm" aria-hidden>
            🧠
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="label-tech-lit">แจ้งเตือนศูนย์ควบคุม · Heuristic v1</span>
              <span className="ml-auto data-value shrink-0 text-[10px] text-hud-dim">ปิดใน {secs} วิ</span>
            </div>
            <p className="mt-1 text-sm leading-5 text-hud-text/90">{alert.text}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={approve}
                disabled={count === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-hud-cyan px-3 py-1.5 text-sm font-extrabold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ⚡ อนุมัติ & ระบายทั้งเครือข่าย
                {count > 0 && (
                  <span className="rounded-full bg-slate-900/25 px-1.5 py-0.5 text-[11px] font-bold">{count} จุด</span>
                )}
              </button>
              <button
                onClick={dismissPlanAlert}
                className="shrink-0 rounded-lg border border-hud-edge px-3 py-1.5 text-xs font-semibold text-hud-dim transition hover:text-hud-text"
                title="ปล่อยให้เจ้าหน้าที่เฝ้าระวังต่อ — ข้อความจะเลือนหายเอง"
              >
                เฝ้าดูต่อ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
