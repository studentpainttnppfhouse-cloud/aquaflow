import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'
import type { NotiKind } from '../../data/types'

const KIND_META: Record<NotiKind, { ring: string; dot: string }> = {
  approval: { ring: 'noti-approval', dot: 'bg-hud-cyan' },
  flood: { ring: 'noti-flood', dot: 'bg-hud-coral' },
  info: { ring: '', dot: 'bg-hud-dim' },
  success: { ring: '', dot: 'bg-hud-green' },
}

/** Side rail of pre-contemplated plans awaiting an approve/reject decision, plus flood-soon warnings. */
export default function NotificationPanel() {
  const notifications = useAppStore((s) => s.notifications)
  const approveNotification = useAppStore((s) => s.approveNotification)
  const dismissNotification = useAppStore((s) => s.dismissNotification)

  const pending = notifications.filter((n) => n.kind === 'approval' || n.kind === 'flood').length

  return (
    <CollapsiblePanel
      id="notifications"
      icon="🔔"
      title="การแจ้งเตือน & อนุมัติ"
      defaultOpen
      mobileDefaultOpen
      badge={
        pending > 0 && (
          <span className="animate-pulse rounded-full bg-hud-coral/20 px-1.5 py-0.5 text-[10px] font-bold text-hud-coral">
            {pending}
          </span>
        )
      }
      bodyClassName="space-y-2 max-h-[22rem] overflow-y-auto panel-scroll"
    >
      {notifications.length === 0 && (
        <p className="px-2 py-6 text-center text-xs text-hud-dim">🟢 ไม่มีการแจ้งเตือน — โครงข่ายอยู่ในเกณฑ์ปกติ</p>
      )}
      {notifications.map((n) => {
        const meta = KIND_META[n.kind]
        const actionable = n.kind === 'approval' || n.kind === 'flood'
        return (
          <article key={n.id} className={`noti-enter rounded-lg border border-hud-edge bg-black/25 p-2.5 ${meta.ring}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs font-bold text-hud-text">{n.title}</div>
                  <span className="data-value shrink-0 text-[10px] text-hud-dim">{n.time}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-hud-text/85">{n.body}</p>
                {n.riskReduction != null && n.riskReduction > 0 && (
                  <span className="data-value mt-1.5 inline-block rounded-md bg-hud-green/15 px-1.5 py-0.5 text-[10px] font-bold text-hud-green">
                    ลดเสี่ยง ~{n.riskReduction}%
                  </span>
                )}
                {actionable ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => approveNotification(n.id)}
                      className="flex-1 rounded-md bg-hud-cyan px-2.5 py-1 text-xs font-bold text-slate-900 transition hover:brightness-110"
                    >
                      ✅ อนุมัติ
                    </button>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="rounded-md border border-hud-edge px-2.5 py-1 text-xs font-semibold text-hud-dim transition hover:text-hud-text"
                    >
                      ✕ ปฏิเสธ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="mt-1.5 text-[10px] font-semibold text-hud-dim underline-offset-2 hover:text-hud-text hover:underline"
                  >
                    ปิด
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </CollapsiblePanel>
  )
}
