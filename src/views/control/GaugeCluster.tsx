import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'
import GaugeBar from '../../components/GaugeBar'
import { TideSpark } from './SidePanels'

function toneForPct(pct: number, invert = false): 'green' | 'amber' | 'coral' {
  const p = invert ? 100 - pct : pct
  if (p > 85) return 'coral'
  if (p > 65) return 'amber'
  return 'green'
}

/** Bottom gauge row — city risk, network average level, and the real official river/canal gauge nearest overflow, plus the tide trend chart. */
export default function GaugeCluster() {
  const cityRisk = useAppStore((s) => s.cityRisk)
  const stations = useAppStore((s) => s.stations)
  const gauges = useAppStore((s) => s.gauges)

  const avgLevel = stations.length ? stations.reduce((a, s) => a + s.level, 0) / stations.length : 0

  // Freeboard (bank_m − waterlevel_m), not a ratio: several real Bangkok gauges
  // reference a datum below mean sea level near the river mouth, so both
  // readings can be negative — dividing them would rank the calmest gauge as
  // "most urgent". Subtracting is sign-safe and is the quantity operators
  // actually care about (metres of headroom before overflow).
  const featuredGauge = useMemo(() => {
    if (!gauges.length) return null
    return [...gauges].sort((a, b) => a.bank_m - a.waterlevel_m - (b.bank_m - b.waterlevel_m))[0]
  }, [gauges])
  // Visualize freeboard on a 2.5 m nominal band: at the bank (0 m freeboard) the
  // gauge reads 100% (overflow); 2.5 m or more of headroom reads as calm.
  const gaugePct = featuredGauge ? Math.min(100, Math.max(0, (1 - (featuredGauge.bank_m - featuredGauge.waterlevel_m) / 2.5) * 100)) : 0

  const riskColor = cityRisk > 70 ? 'coral' : cityRisk > 40 ? 'amber' : 'green'
  const riskLabel = cityRisk > 70 ? 'เสี่ยงสูง' : cityRisk > 40 ? 'เฝ้าระวัง' : 'ปกติ'

  return (
    <CollapsiblePanel id="gauge-cluster" icon="🌡️" title="เกจวัดระดับน้ำเครือข่าย" defaultOpen mobileDefaultOpen={false}>
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
    </CollapsiblePanel>
  )
}
