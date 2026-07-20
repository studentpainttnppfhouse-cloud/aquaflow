import { useAppStore } from '../store/useAppStore'

export default function Landing() {
  const setView = useAppStore((s) => s.setView)
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_50%_0%,#0e2a45_0%,transparent_70%)]" />
      <div className="relative w-full max-w-3xl text-center">
        <div className="text-5xl">🌊</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Aqua<span className="text-hud-cyan">Flow</span>
        </h1>
        <p className="mt-3 text-lg text-hud-text/90">
          ระบบประสานงานสถานีสูบน้ำและประตูระบายน้ำทั่วกรุงเทพฯ ด้วย AI
        </p>
        <p className="mt-1 text-sm text-hud-dim">
          วันนี้แต่ละสถานีทำงานแยกกันและมักสูบสวนจังหวะน้ำขึ้น–ลงของเจ้าพระยา — ระบายเขตหนึ่ง
          น้ำไปท่วมอีกเขต · AquaFlow มองทั้งโครงข่ายพร้อมกัน —{' '}
          <span className="italic text-hud-cyan">"software over concrete"</span>
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setView('control')}
            className="group rounded-2xl border border-hud-edge bg-hud-panel p-6 text-left transition hover:border-hud-cyan/60 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
          >
            <div className="text-3xl">🖥️</div>
            <h2 className="mt-3 text-xl font-bold text-white">ศูนย์ควบคุม</h2>
            <p className="mt-1 text-sm text-hud-dim">
              สำหรับเจ้าหน้าที่ — แผนที่จริงของสถานีสูบน้ำ กทม. · ข้อมูลฝน/น้ำ/น้ำทะเลสด ·
              แผนระบายน้ำจาก AI รออนุมัติ
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-hud-cyan group-hover:underline">
              เข้าสู่ห้องควบคุม →
            </span>
          </button>
          <button
            onClick={() => setView('citizen')}
            className="group rounded-2xl border border-hud-edge bg-hud-panel p-6 text-left transition hover:border-emerald-400/60 hover:shadow-[0_0_40px_rgba(52,211,153,0.12)]"
          >
            <div className="text-3xl">📱</div>
            <h2 className="mt-3 text-xl font-bold text-white">แอปประชาชน</h2>
            <p className="mt-1 text-sm text-hud-dim">
              สำหรับผู้อยู่อาศัย — ความเสี่ยงน้ำท่วมย่านของคุณ · ระดับน้ำคลองใกล้บ้าน ·
              การแจ้งเตือนแบบเรียลไทม์
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-emerald-400 group-hover:underline">
              เปิดแอปประชาชน →
            </span>
          </button>
        </div>

        <p className="mt-8 text-xs text-hud-dim">
          UTCC AI Hackathon 2026 · AI + STEM เพื่อการจัดการน้ำของไทย · ข้อมูล: Open-Meteo ·
          ThaiWater/สสน. · Bangkok Open Data
        </p>
      </div>
    </div>
  )
}
