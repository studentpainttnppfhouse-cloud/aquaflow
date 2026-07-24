import { useAppStore } from '../../store/useAppStore'
import CollapsiblePanel from '../../components/CollapsiblePanel'

/**
 * "AI model card" — an honest, at-a-glance description of what the heuristic /
 * ML planner is fed, what it is, and what it emits. Shown only in heuristic
 * mode (in manual mode the planner is off). Answers the operator's question:
 * *what data does the AI actually use, and what does it give me back?*
 */
export default function ModelCard() {
  const mode = useAppStore((s) => s.mode)
  if (mode !== 'heuristic') return null

  return (
    <CollapsiblePanel
      id="ai-model-card"
      icon="🧠"
      title="ข้อมูลของโมเดล AI"
      defaultOpen={false}
      resizable
      actions={<span className="hidden font-sans text-[10px] uppercase tracking-widest text-hud-dim sm:inline">model card</span>}
      bodyClassName="space-y-2.5"
    >
      <Section
        tag="ข้อมูลเข้า"
        color="text-hud-cyan"
        heading="สิ่งที่ป้อนเข้าโมเดล (Input)"
        items={[
          'ระดับน้ำคลอง/แม่น้ำ — ThaiWater / HII (สสน.)',
          'น้ำขึ้น–น้ำลงเจ้าพระยา — แบบจำลอง/มารีน (ONWR/กรมชลฯ)',
          'พยากรณ์ฝนรายจุด 3 ชม. — Open-Meteo',
          'ความลึกจากเซ็นเซอร์เลเซอร์ + ระยะถึงตลิ่ง (freeboard) รายสถานี',
          'สแนปช็อตระดับน้ำรายพื้นที่ + รหัส METAR ต่อสถานี',
        ]}
      />
      <Section
        tag="แบบจำลอง"
        color="text-hud-amber"
        heading="ตัวโมเดล (Model)"
        items={[
          'ฮิวริสติกแบบโปร่งใส v1 (rule-based, พร้อมสลับเป็น ML/RL ภายหลัง)',
          'เรียนรู้จากมหาอุทกภัย 2554 และน้ำท่วมภาคใต้ 2568',
          'ล็อกการสูบน้ำจริงของ กทม. + งานวิจัย (Google Scholar)',
        ]}
      />
      <Section
        tag="ผลลัพธ์"
        color="text-hud-green"
        heading="สิ่งที่โมเดลส่งออก (Output)"
        items={[
          'แผนระบายน้ำแบบประสานงาน (สูบ/เปิดประตู/รอ) เรียงตามความเร่งด่วน',
          'เหตุผลประกอบแต่ละคำสั่ง + ประมาณการลดความเสี่ยงเมือง',
          'ปุ่ม “ปรับสมดุลน้ำทั้งเครือข่าย” กดครั้งเดียว',
        ]}
      />
      <p className="rounded-lg border border-hud-edge bg-black/25 px-2.5 py-2 text-[11px] leading-4 text-hud-dim">
        โปร่งใสตามหลัก “ตรงไปตรงมา”: AI เสนอเท่านั้น — เจ้าหน้าที่เป็นผู้อนุมัติทุกคำสั่ง ระบบไม่สั่งสูบเองอัตโนมัติ
      </p>
    </CollapsiblePanel>
  )
}

function Section({ tag, color, heading, items }: { tag: string; color: string; heading: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-hud-edge bg-black/25 p-2.5">
      <div className="flex items-center gap-2">
        <span className={`label-tech-lit ${color}`}>{tag}</span>
        <span className="text-[11px] text-hud-dim">{heading}</span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((t) => (
          <li key={t} className="flex gap-1.5 text-[11px] leading-4 text-hud-text/85">
            <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${color.replace('text-', 'bg-')}`} aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
