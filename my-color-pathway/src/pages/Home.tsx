import { Link } from 'react-router-dom';
import { ArrowRight, CalendarHeart, FileText, GraduationCap, HeartPulse, Lock, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { gradeLabel, opportunities, stageInfo } from '../data/mock';
import { LearningBadge } from '../components/ui';
import type { Stage } from '../types';

const stageOrder: Stage[] = ['try', 'do', 'choose'];
const gradeStage = (g: number): Stage => (g <= 8 ? 'try' : g <= 11 ? 'do' : 'choose');

export default function Home() {
  const { student, experiences, s } = useStore();
  const g12 = student.grade === 12;
  const next = g12 ? null : opportunities.find((o) => o.stage === student.stage && o.interestTags.some((t) => student.interests.includes(t)) && !s.applied.includes(o.id));

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden bg-navy text-cream">
        <p className="text-amber">สวัสดี น้อง{student.nickname} 👋</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{g12 ? 'ถึงเวลาเลือก ด้วยสิ่งที่คุณรู้จักตัวเองมา 6 ปี' : 'ค่อย ๆ ค้นหาไปด้วยกัน ไม่ต้องรีบ'}</h1>
        <p className="mt-2 text-cream/80">คุณได้ลองมาแล้ว {experiences.length} ประสบการณ์ ทุกอันช่วยให้สีของคุณชัดขึ้น</p>
      </section>

      <section className="card" aria-labelledby="journey">
        <h2 id="journey" className="h2">เส้นทาง 6 ปีของฉัน</h2>
        <ol className="mt-4 grid grid-cols-6 gap-1.5 sm:gap-3">
          {[7, 8, 9, 10, 11, 12].map((g) => {
            const st = stageInfo[gradeStage(g)];
            const now = g === student.grade;
            const done = g < student.grade;
            return (
              <li key={g} className="text-center">
                <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-bold sm:h-14 sm:w-14 ${now ? 'ring-4 ring-navy ring-offset-2' : ''}`}
                  style={{ background: done || now ? st.color : '#1C254114', color: '#1C2541' }}>
                  {gradeLabel(g)}
                </div>
                {now && <p className="mt-1 text-xs font-bold">ตอนนี้</p>}
              </li>
            );
          })}
        </ol>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {stageOrder.map((k) => {
            const st = stageInfo[k];
            const cur = k === student.stage;
            return (
              <div key={k} className={`rounded-xl border-2 p-3 ${cur ? 'border-navy' : 'border-transparent bg-navy/5'}`}>
                <p className="font-bold"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: st.color }} aria-hidden />“{st.th}” {st.en} · {st.grades}</p>
                <p className="text-sm text-ink">{st.desc}</p>
                {cur && <p className="mt-1 text-xs font-semibold">คุณอยู่ช่วงนี้</p>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="h2 flex items-center gap-2"><CalendarHeart className="h-5 w-5 text-orange" aria-hidden />สัปดาห์นี้</h2>
          {g12 ? (
            <div className="mt-3 space-y-3">
              <p>ลองเลือก 4–6 ประสบการณ์ที่เล่าเรื่องของคุณได้ดีที่สุดลงใน Portfolio</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/portfolio" className="btn-primary"><FileText className="h-4 w-4" />จัด Portfolio</Link>
                <Link to="/programs" className="btn-ghost"><GraduationCap className="h-4 w-4" />ดูสาขาที่อาจเหมาะ</Link>
              </div>
            </div>
          ) : next ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-ink">ก้าวเล็ก ๆ ถัดไป ตรงกับสิ่งที่คุณสนใจ</p>
              <p className="font-semibold">{next.title}</p>
              <p className="text-sm">{next.organization} · {next.schedule}</p>
              <LearningBadge />
              <div><Link to={`/explore/${next.id}`} className="btn-primary mt-2">ดูรายละเอียด<ArrowRight className="h-4 w-4" /></Link></div>
            </div>
          ) : <p className="mt-3">สมัครไว้แล้ว ลองเขียนสะท้อนคิดเรื่องล่าสุดดูไหม</p>}
        </section>
        <section className="card space-y-3">
          <h2 className="h2 flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber" aria-hidden />ทางลัด</h2>
          <Link to={`/reflect/${experiences[0]?.opportunityId ?? ''}`} className="flex items-center justify-between rounded-xl bg-navy/5 p-3 hover:bg-navy/10">เขียนสะท้อนคิดหลังกิจกรรม<ArrowRight className="h-4 w-4" /></Link>
          <Link to="/wellbeing" className="flex items-center justify-between rounded-xl bg-navy/5 p-3 hover:bg-navy/10"><span className="flex items-center gap-2"><HeartPulse className="h-4 w-4" />เช็กใจตัวเอง (ส่วนตัว)</span><ArrowRight className="h-4 w-4" /></Link>
          <Link to="/profile" className="flex items-center justify-between rounded-xl bg-navy/5 p-3 hover:bg-navy/10">ดูสีของฉัน (Skill Profile)<ArrowRight className="h-4 w-4" /></Link>
          <Link to="/privacy" className="flex items-center justify-between rounded-xl bg-navy/5 p-3 hover:bg-navy/10"><span className="flex items-center gap-2"><Lock className="h-4 w-4" />ใครเห็นข้อมูลของฉันได้บ้าง</span><ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </div>
  );
}
