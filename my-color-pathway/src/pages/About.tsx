import { stageInfo } from '../data/mock';
import type { Stage } from '../types';

const principles = [
  ['นักเรียนเป็นคนตัดสินใจ', 'ข้อเสนอสาขาเป็นเพียงคำแนะนำเสมอ'],
  ['ไม่มีคะแนน ไม่มีอันดับ', 'ไม่มี leaderboard ไม่เทียบกับเพื่อน เพราะนั่นคือแรงกดดันที่เรากำลังแก้'],
  ['ข้อมูลเป็นของนักเรียน', 'ตาม PDPA มีความยินยอมผู้ปกครอง และนักเรียนเลือกเองว่าจะแชร์อะไร'],
  ['เรียนรู้ภาคสนาม ไม่ใช่การจ้างงาน', 'ม.3 อายุประมาณ 14–15 ปี ทุกกิจกรรมมีผู้ดูแล'],
  ['TCAS เป็นข้อเสนอความร่วมมือ', 'ส่งออก Portfolio รูปแบบ TCAS ได้ และเสนอความร่วมมือกับ ทปอ.'],
  ['Well-being มาก่อน', 'เช็กใจแบบส่วนตัว ไม่แชร์ถ้าไม่ยินยอม'],
];

const research = [
  ['Free Semester (เกาหลีใต้)', 'ภาคเรียนไม่มีสอบให้นักเรียนมัธยมต้นสำรวจความสนใจและอาชีพ เพื่อเพิ่มความสุขของนักเรียน แต่มีแค่ 1 ภาคเรียน'],
  ['งานวิจัยในโซล (578 คน)', 'ประสบการณ์ทำงานในชุมชนช่วยให้นักเรียนมัธยมต้นค้นหาข้อมูลอาชีพและตัดสินใจอย่างมีเหตุผลได้ดีขึ้นอย่างมีนัยสำคัญ'],
  ['Urban Alliance RCT (สหรัฐฯ, 1,062 คน)', 'การฝึกงานช่วงมัธยมปลายพัฒนาทั้ง hard skills และ soft skills และเพิ่มอัตราการเข้ามหาวิทยาลัย'],
  ['นักเรียนมัธยมในกรุงเทพฯ', 'ใช้สื่อประมาณ 12.9 ชั่วโมงต่อวันในวันธรรมดา'],
];

export default function About() {
  return (
    <div className="space-y-6">
      <section className="card bg-navy text-cream">
        <p className="text-amber">RE:YOUTH Case Competition · นวัตกรรมเพื่อคุณภาพชีวิตที่ดีขึ้นของเยาวชน</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">“เด็กไทยรู้จักอาชีพนับร้อยจากหน้าจอ แต่ไม่เคยรู้จักตัวเอง”</h1>
      </section>
      <section className="card space-y-2">
        <h2 className="h2">ปัญหา</h2>
        <p>เยาวชนไทยเครียดเรื่องอนาคตและค่อย ๆ สูญเสียตัวตน ถูกวัดด้วยเกรดและถูกเปรียบเทียบตลอดเวลา ต้องเลือกสาขาตอน ม.6 ผ่าน TCAS ทั้งที่ไม่เคยได้ลองทำอะไรจริงเลย</p>
        <p>นักเรียนเห็นอาชีพนับร้อยใน TikTok และ YouTube แต่แทบไม่เคยได้ลงมือทำ จึงเลือกตามคะแนนและความคาดหวังของคนอื่น ผลคือความกดดัน ความไม่มั่นใจ และหลายคนกลายเป็นเด็กซิ่ว</p>
        <p className="font-semibold">ปัญหาไม่ใช่การขาดความสามารถ แต่คือการขาดโอกาสค้นหา “สี” ของตัวเอง</p>
      </section>
      <section className="card">
        <h2 className="h2">ทางออก: เส้นทาง 6 ปีที่ให้เยาวชนได้ “ลองก่อนเลือก”</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(Object.keys(stageInfo) as Stage[]).map((k) => (
            <div key={k} className="rounded-xl p-4" style={{ background: stageInfo[k].color + '30' }}>
              <p className="text-lg font-bold">“{stageInfo[k].th}” {stageInfo[k].en}</p>
              <p className="text-sm font-semibold">{stageInfo[k].grades}</p>
              <p className="text-sm">{stageInfo[k].desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm">หัวใจคือ Skill Profile ที่อัปเดตทุกปีจากการสะท้อนคิด ความเห็นพี่เลี้ยง และผลงานจริง โดยไม่มีคะแนนและไม่เทียบกับใคร</p>
      </section>
      <section className="card">
        <h2 className="h2">หลักการที่เราไม่ต่อรอง</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {principles.map(([t, d]) => <li key={t} className="rounded-xl bg-navy/5 p-3"><p className="font-semibold">{t}</p><p className="text-sm text-ink">{d}</p></li>)}
        </ul>
      </section>
      <section className="card">
        <h2 className="h2">งานวิจัยที่รองรับ</h2>
        <ul className="mt-3 space-y-2">{research.map(([t, d]) => <li key={t}><b>{t}:</b> {d}</li>)}</ul>
      </section>
    </div>
  );
}
