import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'
import type { AreaState } from '../../data/types'

const SORTS: { key: AppSort; label: string }[] = [
  { key: 'risk', label: 'ความเสี่ยง' },
  { key: 'level', label: 'ระดับน้ำ' },
  { key: 'actionable', label: 'ต้องระบาย' },
  { key: 'name', label: 'ชื่อเขต' },
]
type AppSort = 'risk' | 'level' | 'name' | 'actionable'

function riskTone(r: number) {
  if (r > 72) return { bar: 'bg-hud-coral', text: 'text-hud-coral' }
  if (r > 48) return { bar: 'bg-hud-amber', text: 'text-hud-amber' }
  return { bar: 'bg-hud-green', text: 'text-hud-green' }
}

function sortAreas(areas: AreaState[], sort: AppSort): AreaState[] {
  const arr = [...areas]
  switch (sort) {
    case 'level':
      return arr.sort((a, b) => b.maxLevel - a.maxLevel)
    case 'actionable':
      return arr.sort((a, b) => b.actionable - a.actionable || b.risk - a.risk)
    case 'name':
      return arr.sort((a, b) => a.district.localeCompare(b.district, 'th'))
    default:
      return arr.sort((a, b) => b.risk - a.risk)
  }
}

export default function AreaPanel() {
  const areas = useAppStore((s) => s.areas)
  const sort = useAppStore((s) => s.areaSort)
  const setSort = useAppStore((s) => s.setAreaSort)
  const mode = useAppStore((s) => s.mode)
  const activateArea = useAppStore((s) => s.activateArea)
  const deactivateArea = useAppStore((s) => s.deactivateArea)
  const activateAll = useAppStore((s) => s.activateAllAreas)

  const sorted = useMemo(() => sortAreas(areas, sort), [areas, sort])
  const hot = areas.filter((a) => a.actionable > 0 || a.atRisk > 0).length
  const active = areas.filter((a) => a.activation === 'active').length

  return (
    <CollapsiblePanel
      id="areas"
      icon="🗺️"
      title="พื้นที่รายเขต"
      defaultOpen
      mobileDefaultOpen={false}
      fill
      badge={
        hot > 0 && (
          <span className="rounded-full bg-hud-coral/15 px-1.5 py-0.5 text-[10px] font-bold text-hud-coral">{hot} เขตเร่งด่วน</span>
        )
      }
      bodyClassName="space-y-2"
    >
      {/* brief plan / bulk control */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-hud-edge bg-black/20 px-2.5 py-1.5">
        <div className="text-[11px] text-hud-dim">
          กำลังทำงาน <span className="data-value text-hud-cyan">{active}</span> · เร่งด่วน{' '}
          <span className="data-value text-hud-coral">{hot}</span> / {areas.length} เขต
        </div>
        <button
          onClick={activateAll}
          disabled={hot === 0}
          className="rounded-md bg-hud-cyan px-2.5 py-1 text-[11px] font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
        >
          {mode === 'auto' ? '⚡ ปรับสมดุลทุกเขต' : '⚡ เปิดใช้งานเขตเร่งด่วน'}
        </button>
      </div>

      {/* sort chips */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="label-tech mr-0.5">เรียงตาม</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
              sort === s.key ? 'bg-hud-cyan text-slate-900' : 'border border-hud-edge text-hud-dim hover:text-hud-text'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {sorted.map((a) => {
          const tone = riskTone(a.risk)
          return (
            <li key={a.district} className="rounded-lg border border-hud-edge bg-black/25 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-hud-text">เขต{a.district}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-hud-dim">
                    <span>{a.count} สถานี</span>
                    {a.pumping > 0 && <span className="text-hud-cyan">💧 {a.pumping}</span>}
                    {a.atRisk > 0 && <span className="text-hud-coral">⚠ {a.atRisk} เสี่ยง</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`data-value text-sm font-bold ${tone.text}`}>{a.risk.toFixed(0)}%</span>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, a.risk)}%` }} />
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                {a.activation === 'active' ? (
                  <>
                    <span className="rounded-md border border-hud-cyan/40 bg-hud-cyan/10 px-2 py-0.5 text-[10px] font-bold text-hud-cyan">
                      🤖 กำลังทำงาน
                    </span>
                    <button
                      onClick={() => deactivateArea(a.district)}
                      className="ml-auto rounded-md border border-hud-edge px-2 py-0.5 text-[10px] font-semibold text-hud-dim transition hover:text-hud-text"
                    >
                      หยุด
                    </button>
                  </>
                ) : a.activation === 'pending' ? (
                  <span className="rounded-md border border-hud-amber/40 bg-hud-amber/10 px-2 py-0.5 text-[10px] font-bold text-hud-amber">
                    ⏳ รออนุมัติในแผงแจ้งเตือน
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] text-hud-dim">
                      {a.actionable > 0 ? `${a.actionable} สถานีพร้อมระบาย` : 'อยู่ในเกณฑ์ปกติ'}
                    </span>
                    <button
                      onClick={() => activateArea(a.district)}
                      disabled={a.actionable === 0 && a.atRisk === 0}
                      className="ml-auto rounded-md bg-hud-cyan/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {mode === 'auto' ? 'เปิดใช้งาน' : 'ขออนุมัติ'}
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </CollapsiblePanel>
  )
}
