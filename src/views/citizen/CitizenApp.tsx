import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import LiveBadge from '../../components/LiveBadge'
import HeroStatus from './HeroStatus'
import CanalList from './CanalList'
import Alerts from './Alerts'
import MiniMap from './MiniMap'

type Tab = 'home' | 'alerts' | 'about'

export default function CitizenApp() {
  const [tab, setTab] = useState<Tab>('home')
  const stations = useAppStore((s) => s.stations)
  const district = useAppStore((s) => s.district)
  const setDistrict = useAppStore((s) => s.setDistrict)
  const a11yLarge = useAppStore((s) => s.a11yLarge)
  const setA11yLarge = useAppStore((s) => s.setA11yLarge)

  const districts = useMemo(
    () => [...new Set(stations.map((s) => s.district))].sort((a, b) => a.localeCompare(b, 'th')),
    [stations],
  )

  return (
    <div className="grid h-full place-items-center bg-gradient-to-b from-hud-bg to-hud-bg2 p-3">
      <div className={`phone-frame flex flex-col bg-hud-bg text-hud-text ${a11yLarge ? 'a11y-large' : ''}`}>
        <header className="flex shrink-0 items-center justify-between border-b border-hud-edge bg-hud-panelSolid px-4 pb-2.5 pt-4">
          <div>
            <div className="label-tech">AquaFlow ประชาชน</div>
            <label className="mt-0.5 flex items-center gap-1 text-lg font-extrabold text-hud-text">
              📍
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="max-w-[11rem] cursor-pointer appearance-none bg-transparent font-extrabold text-hud-text outline-none"
                aria-label="เลือกเขตของคุณ"
              >
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-hud-panelSolid text-hud-text">
                    เขต{d}
                  </option>
                ))}
              </select>
              <span className="text-xs text-hud-dim">▾</span>
            </label>
          </div>
          <button
            onClick={() => setA11yLarge(!a11yLarge)}
            aria-pressed={a11yLarge}
            title="ปรับขนาดตัวอักษรใหญ่ขึ้น สำหรับผู้สูงอายุ/สายตาเลือนราง"
            className={`rounded-lg border px-2 py-1 text-sm font-extrabold ${
              a11yLarge ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            ก<span className="text-base">ก</span>
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto panel-scroll">
          {tab === 'home' && (
            <div className="space-y-3 p-3">
              <HeroStatus />
              <DrainBanner />
              <MiniMap />
              <CanalList />
              <SafetyTips />
            </div>
          )}
          {tab === 'alerts' && <Alerts />}
          {tab === 'about' && <AboutTab />}
        </main>

        <nav className="grid shrink-0 grid-cols-3 border-t border-hud-edge bg-hud-panelSolid text-center text-xs">
          {(
            [
              ['home', '🏠', 'หน้าหลัก'],
              ['alerts', '🔔', 'แจ้งเตือน'],
              ['about', 'ℹ️', 'ข้อมูล'],
            ] as [Tab, string, string][]
          ).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 font-semibold transition ${tab === t ? 'text-hud-cyan' : 'text-hud-dim'}`}
            >
              <div className="text-base">{icon}</div>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

/** Shown while the control center is actively draining this district — the two views share one store, so this reacts to the operator's approval instantly. */
function DrainBanner() {
  const district = useAppStore((s) => s.district)
  const active = useAppStore((s) => s.stations.some((st) => st.pumping && st.district === district))
  const anyPumping = useAppStore((s) => s.stations.some((st) => st.pumping))
  if (!active && !anyPumping) return null
  return (
    <div className="flex items-center gap-2 rounded-xl border border-hud-cyan/30 bg-hud-cyan/10 px-3 py-2 text-sm text-hud-cyan">
      <span className="status-dot-live text-lg">🛟</span>
      {active
        ? 'ศูนย์ควบคุมกำลังเร่งระบายน้ำในพื้นที่ของคุณ — ระดับน้ำกำลังลดลง'
        : 'ศูนย์ควบคุมกำลังระบายน้ำในโครงข่ายคลองของเมือง'}
    </div>
  )
}

function SafetyTips() {
  const risk = useAppStore((s) => {
    const local = s.stations.filter((st) => st.district === s.district)
    if (!local.length) return s.cityRisk
    return (local.reduce((a, x) => a + x.level, 0) / local.length) * 0.7 + s.cityRisk * 0.35
  })
  const tips =
    risk > 70
      ? ['ยกของมีค่าและปลั๊กไฟขึ้นที่สูงอย่างน้อย 30 ซม.', 'เตรียมไฟฉาย พาวเวอร์แบงก์ และน้ำดื่ม', 'หลีกเลี่ยงการขับรถผ่านจุดอ่วมซ้ำซาก', 'ติดตามประกาศจากเขตอย่างใกล้ชิด']
      : risk > 40
        ? ['ติดตามระดับน้ำคลองใกล้บ้านเป็นระยะ', 'ตรวจทางระบายน้ำหน้าบ้านไม่ให้มีขยะอุดตัน', 'วางแผนเส้นทางเลี่ยงจุดที่ท่วมประจำ']
        : ['ใช้ชีวิตได้ตามปกติ', 'ช่วยกันไม่ทิ้งขยะลงคลอง — ขยะคือศัตรูตัวจริงของเครื่องสูบน้ำ', 'บันทึกแอปนี้ไว้ตรวจสถานะช่วงฝนตก']
  return (
    <div className="glass-panel p-3">
      <h3 className="text-sm font-bold text-hud-text">💡 คำแนะนำสำหรับตอนนี้</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-hud-text/80">
        {tips.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-hud-cyan">•</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AboutTab() {
  const feeds = useAppStore((s) => s.feeds)
  return (
    <div className="space-y-3 p-3 text-sm text-hud-text/80">
      <div className="glass-panel p-3">
        <h3 className="font-bold text-hud-text">เกี่ยวกับ AquaFlow</h3>
        <p className="mt-1 leading-6">
          ระบบสาธิตการประสานงานสถานีสูบน้ำ–ประตูระบายน้ำทั่วกรุงเทพฯ สำหรับ UTCC AI Hackathon 2026
          — "software over concrete" · คำแนะนำมาจากกฎเชิงฮิวริสติกที่โปร่งใส (ตัวแทนของโมเดล ML
          ในเวอร์ชันถัดไป) · พิกัดสถานีเป็นค่าโดยประมาณจากข้อมูลเปิด
        </p>
      </div>
      <div className="glass-panel p-3">
        <h3 className="font-bold text-hud-text">แหล่งข้อมูล</h3>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center justify-between">
            <span>🌧️ ฝน/พยากรณ์ — Open-Meteo</span>
            <LiveBadge feed={feeds.rain} />
          </li>
          <li className="flex items-center justify-between">
            <span>💧 ระดับน้ำ — ThaiWater · สสน. (HII)</span>
            <LiveBadge feed={feeds.water} />
          </li>
          <li className="flex items-center justify-between">
            <span>🌊 น้ำขึ้นลง — อ่าวไทย</span>
            <LiveBadge feed={feeds.tide} />
          </li>
          <li className="flex items-center justify-between">
            <span>🏭 ผังสถานี — Bangkok Open Data / สนน.</span>
            <LiveBadge feed={feeds.stations} />
          </li>
        </ul>
        <p className="mt-2 text-xs text-hud-dim">
          สด = ดึงจาก API จริง · แคช = สแนปช็อตสำรองในเครื่อง · จำลอง = แบบจำลองคณิตศาสตร์ ·
          อ้างอิงเพิ่มเติม: กรมอุตุนิยมวิทยา · สำนักการระบายน้ำ กทม.
        </p>
      </div>
    </div>
  )
}
