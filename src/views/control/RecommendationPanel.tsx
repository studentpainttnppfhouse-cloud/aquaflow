import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

const ACTION_META = {
  pump: { label: '💧 สูบเดี๋ยวนี้', cls: 'text-hud-cyan border-hud-cyan/40 bg-hud-cyan/10' },
  open_gate: { label: '🚪 เปิดประตูระบาย', cls: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  wait: { label: '⏳ รอ & เฝ้าระวัง', cls: 'text-hud-amber border-amber-400/40 bg-amber-400/10' },
} as const

export default function RecommendationPanel() {
  const recommendations = useAppStore((s) => s.recommendations)
  const approve = useAppStore((s) => s.approve)
  const mode = useAppStore((s) => s.mode)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-hud-edge bg-hud-panel">
      <div className="flex items-center justify-between border-b border-hud-edge px-3 py-2">
        <h2 className="text-sm font-bold text-white">🤖 แผนระบายน้ำจาก AI</h2>
        <span className="text-[10px] text-hud-dim">
          heuristic v1 · {mode === 'semi' ? 'กึ่งอัตโนมัติ' : 'รออนุมัติ'}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 panel-scroll">
        {recommendations.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-hud-dim">
            🟢 ยังไม่มีสถานีที่ต้องดำเนินการ — โครงข่ายอยู่ในเกณฑ์ปกติ
          </p>
        )}
        {recommendations.map((r) => {
          const meta = ACTION_META[r.action]
          const open = expanded === r.id
          return (
            <article key={r.id} className="rounded-lg border border-hud-edge bg-black/25 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{r.stationName}</div>
                  <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                {r.action !== 'wait' && (
                  <span className="shrink-0 rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    ลดเสี่ยง ~{r.riskReduction}%
                  </span>
                )}
              </div>
              {open && <p className="mt-2 text-xs leading-5 text-hud-text/85">{r.reason}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="rounded-md border border-hud-edge px-2.5 py-1 text-xs font-semibold text-hud-dim hover:text-hud-text"
                >
                  {open ? 'ซ่อนเหตุผล' : 'ดูเหตุผล'}
                </button>
                {r.action !== 'wait' && (
                  <button
                    onClick={() => approve(r.id)}
                    className="flex-1 rounded-md bg-hud-cyan px-2.5 py-1 text-xs font-bold text-slate-900 hover:brightness-110"
                  >
                    ✅ อนุมัติ
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
