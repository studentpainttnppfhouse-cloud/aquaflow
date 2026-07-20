import { districtRisk, useAppStore } from '../../store/useAppStore'

/** Push-style alert feed derived from the shared activity log + current local risk. */
export default function Alerts() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk(s, district))
  const activityLog = useAppStore((s) => s.activityLog)
  const storm = useAppStore((s) => s.storm)

  const advisory =
    risk > 70
      ? { icon: '🚨', title: `ประกาศเตือน เขต${district}`, body: 'ความเสี่ยงน้ำท่วมสูง — ยกของขึ้นที่สูงและติดตามสถานการณ์ใกล้ชิด', cls: 'border-rose-200 bg-rose-50' }
      : risk > 40
        ? { icon: '⚠️', title: `เฝ้าระวัง เขต${district}`, body: 'ระดับน้ำสูงกว่าปกติ ระบบกำลังจัดการโครงข่ายระบายน้ำ', cls: 'border-amber-200 bg-amber-50' }
        : { icon: '✅', title: `เขต${district} ปกติ`, body: 'ไม่มีการแจ้งเตือนความเสี่ยงในขณะนี้', cls: 'border-emerald-200 bg-emerald-50' }

  return (
    <div className="space-y-2 p-3">
      <div className={`rounded-xl border p-3 ${advisory.cls}`}>
        <div className="text-sm font-bold text-slate-900">
          {advisory.icon} {advisory.title}
        </div>
        <p className="mt-1 text-xs text-slate-600">{advisory.body}</p>
      </div>
      {storm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="text-sm font-bold text-slate-900">⛈️ พายุฝนกำลังแรง</div>
          <p className="mt-1 text-xs text-slate-600">กรมอุตุฯ คาดฝนตกหนักต่อเนื่อง — ศูนย์ควบคุมกำลังประสานการระบายทั้งโครงข่าย</p>
        </div>
      )}
      <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">เหตุการณ์ล่าสุดจากศูนย์ควบคุม</h3>
      {activityLog.length === 0 && <p className="text-xs text-slate-400">ยังไม่มีเหตุการณ์</p>}
      {activityLog.slice(0, 12).map((e) => (
        <div key={e.id} className="rounded-lg bg-white p-2.5 text-xs shadow-sm">
          <span className="font-mono text-slate-400">{e.time}</span>
          <span className="ml-2 text-slate-700">{e.text}</span>
        </div>
      ))}
    </div>
  )
}
