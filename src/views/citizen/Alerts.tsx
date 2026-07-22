import { useMemo } from 'react'
import { districtRisk, useAppStore } from '../../store/useAppStore'
import type { Broadcast, Channel } from '../../data/types'
import { CHANNEL_META, SEVERITY_META } from '../../engine/alerting'

const SEV_CARD: Record<Broadcast['severity'], string> = {
  normal: 'border-emerald-200 bg-emerald-50',
  watch: 'border-amber-200 bg-amber-50',
  warning: 'border-orange-200 bg-orange-50',
  emergency: 'border-rose-300 bg-rose-50',
}

/** Read a Thai alert aloud — the IVR/voice channel, in-app, for non-readers. */
function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert('อุปกรณ์นี้ไม่รองรับการอ่านออกเสียง')
    return
  }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'th-TH'
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}

/** Push-style alert feed: received multi-channel broadcasts + the shared activity log. */
export default function Alerts() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk(s, district))
  const activityLog = useAppStore((s) => s.activityLog)
  const storm = useAppStore((s) => s.storm)
  const broadcasts = useAppStore((s) => s.broadcasts)

  const received = useMemo(
    () => broadcasts.filter((b) => b.district === district).slice(0, 3),
    [broadcasts, district],
  )

  const advisory =
    risk > 70
      ? { icon: '🚨', title: `ประกาศเตือน เขต${district}`, body: 'ความเสี่ยงน้ำท่วมสูง — ยกของขึ้นที่สูงและติดตามสถานการณ์ใกล้ชิด', cls: 'border-rose-200 bg-rose-50' }
      : risk > 40
        ? { icon: '⚠️', title: `เฝ้าระวัง เขต${district}`, body: 'ระดับน้ำสูงกว่าปกติ ระบบกำลังจัดการโครงข่ายระบายน้ำ', cls: 'border-amber-200 bg-amber-50' }
        : { icon: '✅', title: `เขต${district} ปกติ`, body: 'ไม่มีการแจ้งเตือนความเสี่ยงในขณะนี้', cls: 'border-emerald-200 bg-emerald-50' }

  return (
    <div className="space-y-2 p-3">
      {/* Multi-channel broadcasts the resident actually "received" */}
      {received.map((b) => {
        const meta = SEVERITY_META[b.severity]
        const gotChannels = [...new Set(b.receipts.map((r) => r.channel))] as Channel[]
        return (
          <div key={b.id} className={`rounded-xl border p-3 ${SEV_CARD[b.severity]}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {meta.icon} เตือนภัยถึงคุณ · {meta.th}
              </span>
              {b.queued && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  ⏳ รอสัญญาณ
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-700">{b.message}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {gotChannels.map((ch) => (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm"
                >
                  {CHANNEL_META[ch].icon} {CHANNEL_META[ch].label}
                </span>
              ))}
              <button
                onClick={() => speak(b.message)}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-sky-700"
              >
                🔊 อ่านออกเสียง
              </button>
            </div>
          </div>
        )
      })}

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
