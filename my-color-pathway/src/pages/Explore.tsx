import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import { useStore } from '../lib/store';
import { interests, stageInfo, typeLabel } from '../data/mock';
import { LearningBadge, PageHeader, SkillChip } from '../components/ui';
import type { Stage } from '../types';

export default function Explore() {
  const { opportunities, student, s } = useStore();
  const [interest, setInterest] = useState('');
  const [format, setFormat] = useState('');
  const [stage, setStage] = useState<Stage | ''>(student.stage);
  const [dur, setDur] = useState('');

  const list = opportunities.filter((o) =>
    (!interest || o.interestTags.includes(interest)) && (!format || o.format === format) && (!stage || o.stage === stage) &&
    (!dur || (dur === 'short' ? o.durationHours <= 8 : o.durationHours > 8)));

  const sel = 'rounded-xl border border-navy/15 bg-white px-3 py-2';
  return (
    <div>
      <PageHeader title="สำรวจโอกาส" sub="ลองก่อนเลือก ทุกกิจกรรมคือการเรียนรู้ภาคสนาม มีผู้ดูแลเสมอ" />
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-sm">ความสนใจ<select className={`${sel} mt-1 w-full`} value={interest} onChange={(e) => setInterest(e.target.value)}><option value="">ทั้งหมด</option>{interests.map((i) => <option key={i}>{i}</option>)}</select></label>
        <label className="text-sm">รูปแบบ<select className={`${sel} mt-1 w-full`} value={format} onChange={(e) => setFormat(e.target.value)}><option value="">ทั้งหมด</option><option value="onsite">ในพื้นที่</option><option value="online">ออนไลน์</option></select></label>
        <label className="text-sm">ระยะเวลา<select className={`${sel} mt-1 w-full`} value={dur} onChange={(e) => setDur(e.target.value)}><option value="">ทั้งหมด</option><option value="short">≤ 8 ชม.</option><option value="long">มากกว่า 8 ชม.</option></select></label>
        <label className="text-sm">ช่วง<select className={`${sel} mt-1 w-full`} value={stage} onChange={(e) => setStage(e.target.value as Stage | '')}><option value="">ทั้งหมด</option>{(Object.keys(stageInfo) as Stage[]).map((k) => <option key={k} value={k}>{stageInfo[k].th} ({stageInfo[k].grades})</option>)}</select></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((o) => (
          <Link key={o.id} to={`/explore/${o.id}`} className="card block space-y-3 transition hover:shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <LearningBadge />
              <span className="chip bg-navy/5">{typeLabel[o.type]}</span>
              {o.format === 'online' && <span className="chip bg-sky/15"><Wifi className="h-3.5 w-3.5" aria-hidden />ออนไลน์</span>}
              {s.applied.includes(o.id) && <span className="chip bg-amber/30">สมัครแล้ว</span>}
            </div>
            <div>
              <h2 className="h2">{o.title}</h2>
              <p className="text-sm text-ink">{o.organization}</p>
            </div>
            <p>{o.description}</p>
            <div className="flex flex-wrap gap-1.5">{o.skills.map((k) => <SkillChip key={k} id={k} />)}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden />{o.durationHours} ชม.</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{o.location}</span>
            </div>
            <p className="flex items-start gap-1.5 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />{o.supervisionNote}</p>
          </Link>
        ))}
        {list.length === 0 && <p className="muted">ยังไม่มีกิจกรรมที่ตรงกับตัวกรอง ลองเปลี่ยนตัวกรองดูนะ</p>}
      </div>
    </div>
  );
}
