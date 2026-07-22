import { useMemo } from 'react'
import { districtRisk, useAppStore } from '../../store/useAppStore'
import type { Broadcast, Severity } from '../../data/types'
import {
  CHANNEL_META,
  SEVERITY_META,
  channelCounts,
  deliveryProgress,
  severityFromRisk,
  smsSegments,
} from '../../engine/alerting'

const SEV_CLS: Record<Severity, string> = {
  normal: 'text-hud-green border-hud-green/40 bg-hud-green/10',
  watch: 'text-hud-amber border-amber-400/40 bg-amber-400/10',
  warning: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  emergency: 'text-hud-red border-red-400/50 bg-red-400/15',
}

export default function BroadcastPanel() {
  const stations = useAppStore((s) => s.stations)
  const cityRisk = useAppStore((s) => s.cityRisk)
  const zones = useAppStore((s) => s.zones)
  const broadcasts = useAppStore((s) => s.broadcasts)
  const online = useAppStore((s) => s.online)
  const broadcastAlert = useAppStore((s) => s.broadcastAlert)
  const broadcastAffected = useAppStore((s) => s.broadcastAffected)
  const setOnline = useAppStore((s) => s.setOnline)

  // Rank districts by current severity so the operator sees the hottest zones first.
  const ranked = useMemo(() => {
    const districts = [...new Set(stations.map((s) => s.district))]
    return districts
      .map((d) => {
        const risk = districtRisk({ stations, cityRisk }, d)
        return { district: d, risk, severity: severityFromRisk(risk), zone: zones[d] }
      })
      .filter((x) => x.zone)
      .sort((a, b) => b.risk - a.risk)
  }, [stations, cityRisk, zones])

  const affected = ranked.filter((r) => r.severity !== 'normal').length

  return (
    <div className="flex flex-col rounded-xl border border-hud-edge bg-hud-panel">
      <div className="flex items-center justify-between border-b border-hud-edge px-3 py-2">
        <h2 className="text-sm font-bold text-white">📣 กระจายเตือนภัยทุกช่องทาง</h2>
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 py-px text-[10px] text-sky-300">
          จำลอง
        </span>
      </div>

      {/* Connectivity simulator — flip offline to demo the queue-and-flush path */}
      <div className="flex items-center justify-between border-b border-hud-edge px-3 py-1.5 text-xs">
        <span className="text-hud-dim">
          {online ? '🟢 ออนไลน์ — ส่งได้ทันที' : '📵 ออฟไลน์ — เข้าคิวรอส่ง'}
        </span>
        <button
          onClick={() => setOnline(!online)}
          className="rounded-full border border-hud-edge px-2 py-0.5 font-semibold text-hud-dim hover:text-hud-text"
        >
          {online ? 'จำลองสัญญาณหลุด' : 'จำลองกลับมาออนไลน์'}
        </button>
      </div>

      <div className="space-y-2 p-2">
        <button
          onClick={broadcastAffected}
          disabled={affected === 0}
          className="w-full rounded-md bg-hud-cyan px-2.5 py-1.5 text-xs font-bold text-slate-900 hover:brightness-110 disabled:opacity-40"
        >
          🚨 กระจายเตือนทุกเขตที่เสี่ยง{affected > 0 ? ` (${affected})` : ''}
        </button>

        {/* Per-zone severity + one-tap broadcast */}
        <ul className="space-y-1">
          {ranked.map(({ district, severity, zone }) => {
            const meta = SEVERITY_META[severity]
            return (
              <li
                key={district}
                className="flex items-center gap-2 rounded-md border border-hud-edge bg-black/25 px-2 py-1"
              >
                <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-bold ${SEV_CLS[severity]}`}>
                  {meta.icon} {meta.th}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-hud-text">เขต{district}</div>
                  <div className="text-[10px] text-hud-dim tabular-nums">
                    ~{zone!.population.toLocaleString('th-TH')} คน
                  </div>
                </div>
                <button
                  onClick={() => broadcastAlert(district)}
                  className="shrink-0 rounded border border-hud-edge px-2 py-0.5 text-[11px] font-semibold text-hud-cyan hover:bg-hud-cyan/10"
                >
                  ส่ง
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Delivery ledger */}
      {broadcasts.length > 0 && (
        <div className="space-y-2 border-t border-hud-edge p-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-hud-dim">การกระจายล่าสุด</h3>
          {broadcasts.slice(0, 3).map((b) => (
            <BroadcastCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  )
}

function BroadcastCard({ b }: { b: Broadcast }) {
  const meta = SEVERITY_META[b.severity]
  const prog = deliveryProgress(b)
  const counts = channelCounts(b)
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0
  const segs = smsSegments(b.message)

  return (
    <article className="rounded-lg border border-hud-edge bg-black/25 p-2">
      <div className="flex items-center gap-2">
        <span className={`rounded-full border px-1.5 py-px text-[10px] font-bold ${SEV_CLS[b.severity]}`}>
          {meta.icon} {meta.th}
        </span>
        <span className="truncate text-xs font-semibold text-hud-text">เขต{b.district}</span>
        {b.queued && (
          <span className="ml-auto rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-px text-[10px] text-hud-amber">
            ⏳ ค้างในคิว
          </span>
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-hud-text/75">{b.message}</p>
      <div className="mt-0.5 text-[9px] text-hud-dim tabular-nums">
        SMS {[...b.message].length} อักขระ · {segs} ส่วน (UCS-2 ภาษาไทย) · เข้าถึง ~{b.reach.toLocaleString('th-TH')} เลขหมาย
      </div>

      {!b.queued && (
        <>
          {/* Overall progress */}
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${prog.failed > 0 ? 'bg-hud-amber' : 'bg-hud-green'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Per-channel delivery */}
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {b.channels.map((ch) => {
              const c = counts[ch]
              const done = c.total > 0 && c.sent + c.failed === c.total
              return (
                <div
                  key={ch}
                  title={CHANNEL_META[ch].blurb}
                  className="flex items-center gap-1 rounded border border-hud-edge px-1.5 py-0.5 text-[10px]"
                >
                  <span>{CHANNEL_META[ch].icon}</span>
                  <span className="truncate text-hud-dim">{CHANNEL_META[ch].label}</span>
                  <span className={`ml-auto tabular-nums ${done ? 'text-hud-green' : 'text-hud-cyan'}`}>
                    {c.sent}/{c.total}
                    {c.failed > 0 && <span className="text-hud-red"> ✕{c.failed}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </article>
  )
}
