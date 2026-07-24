import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

interface DistrictRisk {
  district: string
  riskCount: number
  watchCount: number
  worst: number
}

/**
 * Bottom emergency-broadcast strip — the district alert surface, moved out of the
 * crowded side rail. Districts with stations at risk/watch are ranked most-urgent
 * first; one "ส่ง" tap logs a flood warning to that district's residents.
 */
export default function EmergencyBroadcast() {
  const stations = useAppStore((s) => s.stations)
  const broadcastAlert = useAppStore((s) => s.broadcastAlert)
  const [sent, setSent] = useState<Record<string, number>>({})

  const districts = useMemo<DistrictRisk[]>(() => {
    const by = new Map<string, DistrictRisk>()
    for (const s of stations) {
      if (s.status !== 'risk' && s.status !== 'watch') continue
      const d = by.get(s.district) ?? { district: s.district, riskCount: 0, watchCount: 0, worst: 0 }
      if (s.status === 'risk') d.riskCount++
      else d.watchCount++
      d.worst = Math.max(d.worst, s.level)
      by.set(s.district, d)
    }
    return [...by.values()].sort((a, b) => b.riskCount - a.riskCount || b.worst - a.worst)
  }, [stations])

  const send = (district: string) => {
    broadcastAlert(district)
    setSent((prev) => ({ ...prev, [district]: Date.now() }))
    window.setTimeout(() => {
      setSent((prev) => {
        const next = { ...prev }
        delete next[district]
        return next
      })
    }, 4000)
  }

  return (
    <div className="glass-panel flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 px-3 py-1.5">
        <span aria-hidden>📢</span>
        <span className="label-tech-lit truncate">ประกาศเตือนภัยรายเขต</span>
        {districts.length > 0 && (
          <span className="rounded-full bg-hud-coral/15 px-1.5 py-0.5 text-[10px] font-bold text-hud-coral">
            {districts.length} เขตเร่งด่วน
          </span>
        )}
        <span className="ml-auto hidden text-[10px] text-hud-dim sm:inline">กด “ส่ง” เพื่อแจ้งเตือนประชาชนในเขต</span>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-hud-edge p-2 panel-scroll">
        {districts.length === 0 && (
          <p className="px-2 py-2 text-xs text-hud-dim">🟢 ไม่มีเขตที่ต้องประกาศเตือนภัยขณะนี้</p>
        )}
        {districts.map((d) => {
          const wasSent = sent[d.district]
          const urgent = d.riskCount > 0
          return (
            <div
              key={d.district}
              className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-1.5 ${
                urgent ? 'border-hud-coral/40 bg-hud-coral/10' : 'border-hud-amber/40 bg-hud-amber/10'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${urgent ? 'bg-hud-coral' : 'bg-hud-amber'}`} aria-hidden />
                  <span className="truncate text-sm font-semibold text-hud-text">เขต{d.district}</span>
                </div>
                <div className="label-tech mt-0.5 whitespace-nowrap">
                  {urgent ? `${d.riskCount} จุดเสี่ยง` : `${d.watchCount} จุดเฝ้าระวัง`} · สูงสุด{' '}
                  <span className="data-value">{d.worst.toFixed(0)}%</span>
                </div>
              </div>
              <button
                onClick={() => send(d.district)}
                disabled={!!wasSent}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  wasSent
                    ? 'bg-hud-green/20 text-hud-green'
                    : 'bg-hud-coral text-slate-900 hover:brightness-110'
                }`}
              >
                {wasSent ? '✓ ส่งแล้ว' : 'ส่ง'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
