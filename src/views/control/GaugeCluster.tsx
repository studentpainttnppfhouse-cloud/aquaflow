import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'
import GaugeBar from '../../components/GaugeBar'
import { TideSpark } from './SidePanels'
import { next3hMm } from '../../data/adapters/openMeteo'

function toneForPct(pct: number, invert = false): 'green' | 'amber' | 'coral' {
  const p = invert ? 100 - pct : pct
  if (p > 85) return 'coral'
  if (p > 65) return 'amber'
  return 'green'
}

function Stat({ label, value, unit, tone = 'text-hud-text' }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hud-edge bg-black/20 px-2.5 py-1.5">
      <div className="label-tech truncate">{label}</div>
      <div className={`data-value mt-0.5 text-sm font-bold ${tone}`}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-hud-dim">{unit}</span>}
      </div>
    </div>
  )
}

/** Bottom cluster — gauges + tide, plus an operational metric strip staff can act on. */
export default function GaugeCluster() {
  const cityRisk = useAppStore((s) => s.cityRisk)
  const stations = useAppStore((s) => s.stations)
  const gauges = useAppStore((s) => s.gauges)
  const tide = useAppStore((s) => s.tide)
  const rain = useAppStore((s) => s.rain)
  const storm = useAppStore((s) => s.storm)
  const areas = useAppStore((s) => s.areas)

  const avgLevel = stations.length ? stations.reduce((a, s) => a + s.level, 0) / stations.length : 0
  const pumping = stations.filter((s) => s.pumping)
  const dischargeOnline = pumping.reduce((a, s) => a + s.capacity_cms, 0)
  const totalCapacity = stations.reduce((a, s) => a + s.capacity_cms, 0)
  const atRisk = stations.filter((s) => s.status === 'risk').length
  const watch = stations.filter((s) => s.status === 'watch').length
  const activeAreas = areas.filter((a) => a.activation === 'active').length
  const rain3h = storm ? 32 : next3hMm(rain.hours)
  const tideMid = (tide.range[0] + tide.range[1]) / 2
  const tideHeadroom = tide.phase === 'falling' || tide.height < tideMid

  const featuredGauge = useMemo(() => {
    if (!gauges.length) return null
    return [...gauges].sort((a, b) => a.bank_m - a.waterlevel_m - (b.bank_m - b.waterlevel_m))[0]
  }, [gauges])
  const gaugePct = featuredGauge ? Math.min(100, Math.max(0, (1 - (featuredGauge.bank_m - featuredGauge.waterlevel_m) / 2.5) * 100)) : 0

  const riskColor = cityRisk > 70 ? 'coral' : cityRisk > 40 ? 'amber' : 'green'
  const riskLabel = cityRisk > 70 ? 'เสี่ยงสูง' : cityRisk > 40 ? 'เฝ้าระวัง' : 'ปกติ'

  return (
    <CollapsiblePanel id="gauge-cluster" icon="🌡️" title="ภาพรวมเครือข่าย & เกจวัดระดับน้ำ" defaultOpen mobileDefaultOpen={false}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex flex-wrap items-start justify-around gap-5 sm:justify-start sm:gap-8">
          <GaugeBar label="ความเสี่ยงเมือง" value={cityRisk.toFixed(0)} unit="%" pct={cityRisk} tone={riskColor} sub={riskLabel} />
          <GaugeBar
            label="ระดับน้ำเฉลี่ยเครือข่าย"
            value={avgLevel.toFixed(0)}
            unit="%"
            pct={avgLevel}
            tone={toneForPct(avgLevel)}
            sub={`${stations.length} สถานี`}
          />
          {featuredGauge && (
            <GaugeBar
              label={featuredGauge.name.length > 18 ? 'ระดับน้ำแม่น้ำ (ทางการ)' : featuredGauge.name}
              value={featuredGauge.waterlevel_m.toFixed(2)}
              unit="ม."
              pct={gaugePct}
              tone={toneForPct(gaugePct)}
              sub={`ตลิ่ง ${featuredGauge.bank_m.toFixed(2)} ม.`}
            />
          )}
        </div>
        <div className="border-t border-hud-edge pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <TideSpark />
        </div>
      </div>

      {/* operational metric strip — more info for staff */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-hud-edge pt-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="กำลังระบายรวม" value={dischargeOnline.toFixed(0)} unit="ลบ.ม./วิ" tone="text-hud-cyan" />
        <Stat
          label="ใช้กำลังระบาย"
          value={totalCapacity ? ((dischargeOnline / totalCapacity) * 100).toFixed(0) : '0'}
          unit={`% (${pumping.length} จุด)`}
          tone="text-hud-cyan"
        />
        <Stat label="สถานีเสี่ยงสูง" value={String(atRisk)} unit="จุด" tone={atRisk ? 'text-hud-coral' : 'text-hud-green'} />
        <Stat label="สถานีเฝ้าระวัง" value={String(watch)} unit="จุด" tone={watch ? 'text-hud-amber' : 'text-hud-green'} />
        <Stat label="เขตกำลังทำงาน" value={String(activeAreas)} unit={`/ ${areas.length}`} tone="text-hud-cyan" />
        <Stat label="ฝนคาด 3 ชม." value={rain3h.toFixed(1)} unit="มม." tone={rain3h > 15 ? 'text-hud-coral' : rain3h > 5 ? 'text-hud-amber' : 'text-hud-text'} />
        <Stat
          label="ช่องรับน้ำแม่น้ำ"
          value={tideHeadroom ? 'พร้อม' : 'จำกัด'}
          unit={`${tide.height.toFixed(2)} ม. ${tide.phase === 'rising' ? '▲' : '▼'}`}
          tone={tideHeadroom ? 'text-hud-green' : 'text-hud-amber'}
        />
      </div>
    </CollapsiblePanel>
  )
}
