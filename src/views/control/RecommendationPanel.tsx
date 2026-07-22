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
  const approve = useAppStore((s) => s.approve)
  const mode = useAppStore((s) => s.mode)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <CollapsiblePanel
      id="ai-recommendations"
      icon="🤖"
      title="แผนระบายน้ำจาก AI"
      defaultOpen
      mobileDefaultOpen={false}
      fill
      badge={
        recommendations.length > 0 && (
          <span className="rounded-full bg-hud-cyan/15 px-1.5 py-0.5 text-[10px] font-bold text-hud-cyan">
            {recommendations.length}
          </span>
        )
      }
      actions={
        <span className="hidden font-sans text-[10px] uppercase tracking-widest text-hud-dim sm:inline">
          heuristic v1 · {mode === 'semi' ? 'กึ่งอัตโนมัติ' : 'รออนุมัติ'}
        </span>
      }
      bodyClassName="space-y-2"
    >
      {recommendations.length === 0 && (
        <p className="px-2 py-6 text-center text-xs text-hud-dim">
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
                      className="flex-1 rounded-md bg-hud-cyan px-2.5 py-1 text-xs font-bold text-slate-900 transition hover:brightness-110"
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
