import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { consentRecords, mentors, stageInfo, typeLabel } from '../data/mock';
import { LearningBadge, Note, SkillChip } from '../components/ui';

export default function OpportunityDetail() {
  const { id } = useParams();
  const { opportunities, student, s, update } = useStore();
  const o = opportunities.find((x) => x.id === id);
  if (!o) return <p>ไม่พบกิจกรรม <Link to="/explore" className="underline">กลับ</Link></p>;
  const m = mentors.find((x) => x.id === o.mentorId);
  const applied = s.applied.includes(o.id);
  const consent = consentRecords.find((c) => c.studentId === student.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/explore" className="inline-flex items-center gap-1 text-sm hover:underline"><ArrowLeft className="h-4 w-4" />กลับไปสำรวจ</Link>
      <div className="card space-y-4">
        <div className="flex flex-wrap gap-2"><LearningBadge /><span className="chip bg-navy/5">{typeLabel[o.type]}</span><span className="chip" style={{ background: stageInfo[o.stage].color + '40' }}>ช่วง “{stageInfo[o.stage].th}”</span></div>
        <h1 className="h1">{o.title}</h1>
        <p className="text-ink">{o.organization}</p>
        <p>{o.description}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2"><CalendarDays className="h-5 w-5 text-sky" aria-hidden /><div><dt className="text-xs text-ink">ตารางเวลา</dt><dd>{o.schedule}</dd></div></div>
          <div className="flex gap-2"><Clock className="h-5 w-5 text-sky" aria-hidden /><div><dt className="text-xs text-ink">รวม</dt><dd>{o.durationHours} ชั่วโมง</dd></div></div>
          <div className="flex gap-2"><MapPin className="h-5 w-5 text-sky" aria-hidden /><div><dt className="text-xs text-ink">สถานที่</dt><dd>{o.location}</dd></div></div>
          <div className="flex gap-2"><Users className="h-5 w-5 text-sky" aria-hidden /><div><dt className="text-xs text-ink">รับ</dt><dd>{o.capacity} คน</dd></div></div>
        </dl>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2">
          <h2 className="h2">สิ่งที่จะได้ทำ</h2>
          <ul className="space-y-1">{o.expect.map((e) => <li key={e} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf" aria-hidden />{e}</li>)}</ul>
          <h3 className="pt-2 font-semibold">ทักษะที่จะได้ฝึก</h3>
          <div className="flex flex-wrap gap-1.5">{o.skills.map((k) => <SkillChip key={k} id={k} />)}</div>
        </div>
        <div className="card space-y-3">
          <h2 className="h2">พี่เลี้ยงและความปลอดภัย</h2>
          {m && <p className="flex items-center gap-2"><UserRound className="h-5 w-5" aria-hidden /><span><b>{m.name}</b> · {m.role}</span></p>}
          <p className="flex items-start gap-2"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-leaf" aria-hidden />{o.supervisionNote}</p>
          <Note tone="green">นี่คือการเรียนรู้ภาคสนาม (Job Shadowing) ไม่ใช่การจ้างงาน ไม่มีค่าจ้าง และโรงเรียนเป็นผู้ดูแล</Note>
        </div>
      </div>
      <div className="card space-y-3">
        <h2 className="h2">ความยินยอมผู้ปกครอง</h2>
        <p>{consent ? `✓ ${consent.parentName} ยินยอมให้เข้าร่วมกิจกรรมนอกโรงเรียนแล้ว` : 'ต้องได้รับความยินยอมจากผู้ปกครองก่อน'}</p>
        {applied ? (
          <Note tone="green">ส่งใบสมัครแล้ว ครูผู้ประสานงานจะยืนยันกับคุณภายใน 3 วัน (จำลอง)</Note>
        ) : (
          <button className="btn-accent w-full sm:w-auto" onClick={() => update((x) => ({ ...x, applied: [...x.applied, o.id] }))}>สมัครเข้าร่วม (จำลอง)</button>
        )}
        <p className="text-sm text-ink">ไปแล้วไม่ชอบก็ไม่เป็นไร การรู้ว่าอะไร “ไม่ใช่” ก็เป็นการรู้จักตัวเองเหมือนกัน</p>
      </div>
    </div>
  );
}
