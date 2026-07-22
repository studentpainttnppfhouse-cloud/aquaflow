import { districtRisk, useAppStore } from '../../store/useAppStore'

/** Push-style alert feed derived from the shared activity log + current local risk. */
export default function Alerts() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk(s, district))
  const activityLog = useAppStore((s) => s.activityLog)
  const storm = useAppStore((s) => s.storm)

  const advisory =
    risk > 70
      ? { icon: '🚨', title: `ประกาศเตือน เขต${district}`, body: 'ความเสี่ยงน้ำท่วมสูง — ยกของขึ้นที่สูงและติดตามสถานการณ์ใกล้ชิด', cls: 'border-hud-coral/40 bg-hud-coral/10' }
      : risk > 40
        ? { icon: '⚠️', title: `เฝ้าระวัง เขต${district}`, body: 'ระดับน้ำสูงกว่าปกติ ระบบกำลังจัดการโครงข่ายระบายน้ำ', cls: 'border-hud-amber/40 bg-hud-amber/10' }
        : { icon: '✅', title: `เขต${district} ปกติ`, body: 'ไม่มีการแจ้งเตือนความเสี่ยงในขณะนี้', cls: 'border-hud-green/40 bg-hud-green/10' }

  return (
    <div className="space-y-2 p-3">
      <div className={`rounded-xl border p-3 backdrop-blur-md ${advisory.cls}`}>
        <div className="text-sm font-bold text-hud-text">
          {advisory.icon} {advisory.title}
        </div>
        <p className="mt-1 text-xs text-hud-text/80">{advisory.body}</p>
      </div>
      {storm && (
        <div className="rounded-xl border border-hud-cyan/30 bg-hud-cyan/10 p-3 backdrop-blur-md">
          <div className="text-sm font-bold text-hud-text">⛈️ พายุฝนกำลังแรง</div>
          <p className="mt-1 text-xs text-hud-text/80">กรมอุตุฯ คาดฝนตกหนักต่อเนื่อง — ศูนย์ควบคุมกำลังประสานการระบายทั้งโครงข่าย</p>
        </div>
      )}
      <h3 className="label-tech pt-1">เหตุการณ์ล่าสุดจากศูนย์ควบคุม</h3>
      {activityLog.length === 0 && <p className="text-xs text-hud-dim">ยังไม่มีเหตุการณ์</p>}
      {activityLog.slice(0, 12).map((e) => (
        <div key={e.id} className="glass-panel p-2.5 text-xs">
          <span className="data-value text-hud-dim">{e.time}</span>
          <span className="ml-2 text-hud-text/85">{e.text}</span>
        </div>
      ))}
    </div>
  )
}
