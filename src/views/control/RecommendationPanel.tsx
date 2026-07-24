import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'

const ACTION_META = {
  pump: { label: 'สูบเดี๋ยวนี้', cls: 'text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10' },
  open_gate: { label: 'เปิดประตูระบาย', cls: 'text-hud-green border-hud-green/40 bg-hud-green/10' },
  wait: { label: 'รอ & เฝ้าระวัง', cls: 'text-hud-amber border-hud-amber/40 bg-hud-amber/10' },
} as const

export default function RecommendationPanel() {
  const recommendations = useAppStore((s) => s.recommendations)
  const stations = useAppStore((s) => s.stations)
  const cityRisk = useAppStore((s) => s.cityRisk)
  const storm = useAppStore((s) => s.storm)
  const approve = useAppStore((s) => s.approve)
  const equalizeNetwork = useAppStore((s) => s.equalizeNetwork)
  const [expanded, setExpanded] = useState<string | null>(null)

  const actionable = recommendations.filter((r) => r.action !== 'wait')
  const atRisk = stations.filter((s) => s.status === 'risk').length
  const pumping = stations.filter((s) => s.pumping).length
  const drainable = stations.filter((s) => !s.pumping && s.level > 45).length

  // One honest situation sentence — replaces the separate "notification" surface.
  const summary = storm
    ? `พายุฝนกำลังปกคลุม · ${atRisk} สถานีเข้าระดับเสี่ยง`
    : atRisk > 0
      ? `${atRisk} สถานีอยู่ในระดับเสี่ยงสูง`
      : pumping > 0
        ? `กำลังระบายน้ำ ${pumping} จุด — ระดับกำลังลดลง`
        : 'โครงข่ายอยู่ในเกณฑ์ปกติ'

  const riskTone = cityRisk > 70 ? 'text-hud-coral' : cityRisk > 40 ? 'text-hud-amber' : 'text-hud-green'

  return (
    <CollapsiblePanel
      id="ai-recommendations"
      icon="🤖"
      title="แผนระบายน้ำจาก AI"
      defaultOpen
      mobileDefaultOpen
      fill
      badge={
        actionable.length > 0 && (
          <span className="rounded-full bg-hud-cyan/15 px-1.5 py-0.5 text-[10px] font-bold text-hud-cyan">
            {actionable.length}
          </span>
        )
      }
      actions={
        <span className="hidden font-sans text-[10px] uppercase tracking-widest text-hud-dim sm:inline">
          heuristic v1
        </span>
      }
      bodyClassName="space-y-2"
    >
      {/* Consolidated situation + single coordinated action — plan and alert in one place. */}
      <div className="rounded-lg border border-hud-edge bg-black/30 p-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-hud-text/85">{summary}</span>
          <span className={`data-value shrink-0 text-sm font-bold ${riskTone}`}>{cityRisk.toFixed(0)}%</span>
        </div>
        <button
          onClick={equalizeNetwork}
          disabled={drainable === 0}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-hud-cyan px-3 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ⚡ ปรับสมดุลน้ำทั้งเครือข่าย
          {drainable > 0 && (
            <span className="rounded-full bg-slate-900/25 px-1.5 py-0.5 text-[11px] font-bold">{drainable} จุด</span>
          )}
        </button>
        <p className="mt-1.5 text-[11px] leading-4 text-hud-dim">
          กดครั้งเดียว — ระบบเปิดประตู/สั่งสูบทุกจุดที่น้ำสูงพร้อมกัน แล้วดึงระดับน้ำทุกพื้นที่เข้าสู่สมดุลโดยอัตโนมัติ
        </p>
      </div>

      {actionable.length > 0 && (
        <div className="label-tech px-1 pt-1">ไล่ทีละจุด (ถ้าต้องการ)</div>
      )}
      {recommendations.length === 0 && (
        <p className="px-2 py-4 text-center text-xs text-hud-dim">
          🟢 ยังไม่มีสถานีที่ต้องดำเนินการ — โครงข่ายอยู่ในเกณฑ์ปกติ
        </p>
      )}
      {recommendations.map((r, i) => {
        const meta = ACTION_META[r.action]
        const open = expanded === r.id
        return (
          <article key={r.id} className="rounded-lg border border-hud-edge bg-black/25 p-2.5">
            <div className="flex items-start gap-2.5">
              <span className="data-value mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-hud-edge text-[11px] font-bold text-hud-dim">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-hud-text">{r.stationName}</div>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  {r.action !== 'wait' && (
                    <span className="data-value shrink-0 rounded-md bg-hud-green/15 px-1.5 py-0.5 text-[11px] font-bold text-hud-green">
                      ลดเสี่ยง ~{r.riskReduction}%
                    </span>
                  )}
                </div>
                {open && <p className="mt-2 text-xs leading-5 text-hud-text/85">{r.reason}</p>}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setExpanded(open ? null : r.id)}
                    className="rounded-md border border-hud-edge px-2.5 py-1 text-xs font-semibold text-hud-dim transition hover:border-hud-edgeStrong hover:text-hud-text"
                  >
                    {open ? 'ซ่อนเหตุผล' : 'ดูเหตุผล'}
                  </button>
                  {r.action !== 'wait' && (
                    <button
                      onClick={() => approve(r.id)}
                      className="flex-1 rounded-md bg-hud-cyan/90 px-2.5 py-1 text-xs font-bold text-slate-900 transition hover:brightness-110"
                    >
                      ✅ อนุมัติ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </CollapsiblePanel>
  )
}
