import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const STEPS: Record<'control' | 'citizen', { icon: string; title: string; body: string }[]> = {
  control: [
    {
      icon: '🗺️',
      title: 'แผนที่สถานการณ์จริง',
      body: 'จุดบนแผนที่คือสถานีสูบน้ำ ประตูระบายน้ำ และอุโมงค์ยักษ์ของ กทม. ตามพิกัดจริง (โดยประมาณ) — สีบอกสถานะ: เขียวปกติ · เหลืองเฝ้าระวัง · แดงเสี่ยง · ฟ้ากำลังสูบ คลิกที่จุดเพื่อดูรายละเอียดและสั่งการ',
    },
    {
      icon: '🤖',
      title: 'AI วางแผน — คุณตัดสินใจ',
      body: 'แผงคำแนะนำจะจัดลำดับการสูบทั้งโครงข่ายให้สอดคล้องจังหวะน้ำขึ้น–ลงเจ้าพระยา และกันไม่ให้หลายสถานีระบายลงจุดเดียวจนน้ำย้ายไปท่วมเขตปลายน้ำ กด "ดูเหตุผล" เพื่อดูตรรกะ แล้วกด "อนุมัติ" เพื่อสั่งการ',
    },
    {
      icon: '⛈️',
      title: 'ลองสถานการณ์พายุ',
      body: 'กดปุ่ม "จำลองพายุฝน" เพื่อฉีดฝนหนักทั้งเมือง แล้วดูระบบจัดคิวระบายน้ำ — เกจความเสี่ยงและระดับน้ำจะค่อย ๆ ลดลงเมื่อคุณอนุมัติแผน และหน้าจอประชาชนจะเห็นเหตุการณ์เดียวกันทันที',
    },
  ],
  citizen: [
    {
      icon: '📍',
      title: 'เลือกย่านของคุณ',
      body: 'เลือกเขตที่คุณอยู่ การ์ดสถานะจะบอกความเสี่ยงน้ำท่วมของย่านนั้นแบบเรียลไทม์ อิงจากระดับน้ำคลองรอบตัวคุณและสถานการณ์ทั้งเมือง',
    },
    {
      icon: '🛟',
      title: 'รู้ทันทีเมื่อรัฐลงมือ',
      body: 'เมื่อศูนย์ควบคุมอนุมัติการระบายน้ำในพื้นที่ของคุณ แถบ "กำลังเร่งระบายน้ำ" จะขึ้นทันที และสถานะจะค่อย ๆ คลายจากแดงเป็นเขียวตามระดับน้ำที่ลดจริง',
    },
    {
      icon: '🔔',
      title: 'แจ้งเตือนและคำแนะนำ',
      body: 'แท็บแจ้งเตือนรวมเหตุการณ์ล่าสุด ส่วนคำแนะนำความปลอดภัยจะปรับตามระดับความเสี่ยง — ตั้งแต่ใช้ชีวิตปกติไปจนถึงเตรียมยกของขึ้นที่สูง',
    },
  ],
}

export default function Guide({ audience }: { audience: 'control' | 'citizen' }) {
  const [step, setStep] = useState(0)
  const finishGuide = useAppStore((s) => s.finishGuide)
  const steps = STEPS[audience]
  const last = step === steps.length - 1
  const s = steps[step]
  return (
    <div className="grid h-full place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-hud-edge bg-hud-panel p-8 text-center shadow-2xl">
        <div className="text-5xl">{s.icon}</div>
        <h2 className="mt-4 text-xl font-bold text-white">{s.title}</h2>
        <p className="mt-3 text-sm leading-6 text-hud-text/85">{s.body}</p>
        <div className="mt-6 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-hud-cyan' : 'w-1.5 bg-hud-track'}`}
            />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button className="text-sm text-hud-dim hover:text-hud-text" onClick={() => finishGuide(audience)}>
            ข้าม
          </button>
          <button
            className="rounded-full bg-hud-cyan px-5 py-2 text-sm font-bold text-slate-900 hover:brightness-110"
            onClick={() => (last ? finishGuide(audience) : setStep(step + 1))}
          >
            {last ? 'เริ่มใช้งาน' : 'ถัดไป'}
          </button>
        </div>
      </div>
    </div>
  )
}
