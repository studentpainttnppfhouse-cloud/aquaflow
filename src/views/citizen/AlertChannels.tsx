import { useEffect, useState } from 'react'
import { useAppStore, districtRisk } from '../../store/useAppStore'

function useDistrictContext() {
  const district = useAppStore((s) => s.district)
  const risk = useAppStore((s) => districtRisk({ stations: s.stations, cityRisk: s.cityRisk }, s.district))
  const draining = useAppStore((s) => s.stations.some((st) => st.pumping && st.district === s.district))
  const level = risk > 70 ? 'high' : risk > 40 ? 'watch' : 'ok'
  return { district, risk, draining, level } as const
}

function headline(district: string, level: string, draining: boolean) {
  if (level === 'high')
    return `ประกาศเตือนภัย: พื้นที่เขต${district} เสี่ยงน้ำท่วมสูง โปรดยกของขึ้นที่สูงและติดตามสถานการณ์`
  if (level === 'watch')
    return `เฝ้าระวัง: ระดับน้ำในคลองเขต${district} กำลังสูงขึ้น โปรดเตรียมพร้อม`
  if (draining) return `ศูนย์ควบคุมกำลังเร่งระบายน้ำในเขต${district} — ระดับน้ำกำลังลดลง`
  return `สถานการณ์น้ำเขต${district} อยู่ในเกณฑ์ปกติ`
}

const now = () =>
  new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

/**
 * Citizen multi-channel alerting demo — the same live risk pushed out through
 * every channel a Bangkok resident actually receives warnings on: LINE Official
 * Account, a native phone push, social media, and the community loudspeaker.
 */
export default function AlertChannels() {
  const { district, level, draining } = useDistrictContext()
  const [pushVisible, setPushVisible] = useState(false)
  const msg = headline(district, level, draining)
  const toneCls =
    level === 'high'
      ? 'text-hud-coral'
      : level === 'watch'
        ? 'text-hud-amber'
        : draining
          ? 'text-hud-cyan'
          : 'text-hud-green'

  const firePush = () => {
    setPushVisible(true)
  }
  useEffect(() => {
    if (!pushVisible) return
    const t = setTimeout(() => setPushVisible(false), 5000)
    return () => clearTimeout(t)
  }, [pushVisible])

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-hud-text">📢 การแจ้งเตือนหลายช่องทาง</h2>
        <button
          onClick={firePush}
          className="rounded-full bg-hud-cyan px-3 py-1 text-xs font-bold text-slate-900 transition hover:brightness-110"
        >
          ▶️ ทดสอบส่ง
        </button>
      </div>
      <p className="text-xs leading-5 text-hud-dim">
        ข้อความเดียวกัน ส่งออกทุกช่องทางพร้อมกันตามระดับความเสี่ยงของเขตคุณแบบเรียลไทม์ —{' '}
        <span className={`font-bold ${toneCls}`}>
          {level === 'high' ? 'เสี่ยงสูง' : level === 'watch' ? 'เฝ้าระวัง' : draining ? 'กำลังระบาย' : 'ปกติ'}
        </span>
      </p>

      <LineMockup district={district} msg={msg} draining={draining} />
      <PushMockup msg={msg} />
      <SocialMockup district={district} msg={msg} level={level} />
      <LoudspeakerMockup district={district} msg={msg} level={level} />

      {/* Simulated native push banner that slides in over the phone screen */}
      {pushVisible && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[2000] flex justify-center px-4">
          <div className="node-float w-full max-w-[22rem] rounded-2xl border border-white/15 bg-[#1c2230]/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-hud-cyan/20 text-base">🌊</span>
              <span className="text-xs font-bold text-hud-text">AquaFlow</span>
              <span className="ml-auto text-[10px] text-hud-dim">ตอนนี้</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-hud-text">แจ้งเตือนสถานการณ์น้ำ</div>
            <div className="mt-0.5 text-xs leading-4 text-hud-text/80">{msg}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── LINE Official Account chat mockup ───────────────────────────────────────
function LineMockup({ district, msg, draining }: { district: string; msg: string; draining: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hud-edge">
      <div className="flex items-center gap-2 bg-[#06C755] px-3 py-2 text-white">
        <span className="text-sm">‹</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-sm">🌊</span>
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-sm font-bold">
            AquaFlow แจ้งเตือนน้ำท่วม
            <span className="rounded bg-white/25 px-1 text-[9px] font-bold">OA</span>
          </div>
          <div className="text-[10px] opacity-90">Official Account · กทม.</div>
        </div>
        <span className="ml-auto text-xs opacity-90">☰</span>
      </div>
      <div className="space-y-2 bg-[#7c9fc0] p-3">
        <div className="text-center">
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] text-white/90">วันนี้ {now()} น.</span>
        </div>
        <ChatBubble>📍 เขต{district}</ChatBubble>
        <ChatBubble>{msg}</ChatBubble>
        {draining && <ChatBubble>🛟 ทีมระบายน้ำกำลังทำงานในพื้นที่ของคุณแล้ว</ChatBubble>}
        <ChatBubble>
          พิมพ์ “สถานะ” เพื่อดูระดับน้ำล่าสุด หรือ “แผนที่” เพื่อดูจุดเสี่ยงใกล้คุณ
        </ChatBubble>
      </div>
    </div>
  )
}

function ChatBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-1.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/85 text-xs">🌊</span>
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-3 py-1.5 text-[13px] leading-4 text-slate-800 shadow">
        {children}
      </div>
      <span className="mb-0.5 text-[9px] text-white/80">{now()}</span>
    </div>
  )
}

// ── Native push notification preview ────────────────────────────────────────
function PushMockup({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-hud-edge bg-black/20 p-2.5">
      <div className="label-tech mb-1.5 px-1">🔔 การแจ้งเตือนหน้าจอ (Push)</div>
      <div className="rounded-xl border border-white/10 bg-[#1c2230]/90 p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-hud-cyan/20 text-sm">🌊</span>
          <span className="text-[11px] font-bold text-hud-text">AQUAFLOW</span>
          <span className="ml-auto text-[10px] text-hud-dim">ตอนนี้</span>
        </div>
        <div className="mt-1 text-[13px] font-semibold text-hud-text">แจ้งเตือนสถานการณ์น้ำ</div>
        <div className="mt-0.5 text-[11px] leading-4 text-hud-text/75">{msg}</div>
      </div>
    </div>
  )
}

// ── Social media post mockup ────────────────────────────────────────────────
function SocialMockup({ district, msg, level }: { district: string; msg: string; level: string }) {
  const tag = level === 'high' ? '#เตือนภัยน้ำท่วม' : level === 'watch' ? '#เฝ้าระวังน้ำท่วม' : '#สถานการณ์น้ำกทม'
  return (
    <div className="rounded-2xl border border-hud-edge bg-black/20 p-2.5">
      <div className="label-tech mb-1.5 px-1">📣 โซเชียลมีเดีย</div>
      <div className="rounded-xl border border-white/10 bg-[#15202b] p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-hud-cyan/20 text-base">🌊</span>
          <div className="leading-tight">
            <div className="flex items-center gap-1 text-[13px] font-bold text-white">
              สำนักการระบายน้ำ กทม.
              <span className="text-hud-cyan">✔</span>
            </div>
            <div className="text-[11px] text-slate-400">@bkk_drainage · ตอนนี้</div>
          </div>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-slate-100">
          {msg}{' '}
          <span className="text-hud-cyan">
            {tag} #เขต{district}
          </span>
        </p>
        <div className="mt-2 flex gap-6 text-[11px] text-slate-400">
          <span>💬 128</span>
          <span>🔁 542</span>
          <span>❤️ 1.2พัน</span>
        </div>
      </div>
    </div>
  )
}

// ── Community loudspeaker (หอกระจายข่าว) mockup ──────────────────────────────
function LoudspeakerMockup({ district, msg, level }: { district: string; msg: string; level: string }) {
  const active = level !== 'ok'
  return (
    <div className="rounded-2xl border border-hud-edge bg-black/20 p-2.5">
      <div className="label-tech mb-1.5 px-1">🔊 หอกระจายข่าวชุมชน</div>
      <div
        className={`flex items-start gap-3 rounded-xl border p-3 ${
          active ? 'border-hud-amber/40 bg-hud-amber/10' : 'border-hud-edge bg-black/20'
        }`}
      >
        <div className="relative shrink-0">
          <span className="text-2xl">📢</span>
          {active && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-hud-coral status-dot-live" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] font-bold text-hud-text">
            หอกระจายข่าวชุมชนเขต{district}
            {active && <span className="text-[10px] font-bold text-hud-coral">● กำลังประกาศ</span>}
          </div>
          <p className="mt-1 text-[12px] leading-5 text-hud-text/80">
            “เรียนพี่น้องประชาชน{active ? ' โปรดทราบ' : ''} — {msg}
            {active ? ' หากต้องการความช่วยเหลือ โทร 1555 สายด่วน กทม.”' : '”'}
          </p>
          {active && (
            <div className="mt-2 flex items-end gap-0.5" aria-hidden>
              {[6, 12, 8, 16, 10, 14, 7, 13, 9].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-sm bg-hud-amber/70"
                  style={{ height: h, animation: `status-pulse ${0.8 + (i % 3) * 0.25}s ease-in-out infinite` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
