import { useState } from 'react';
import { Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useStore } from '../lib/store';
import { stageInfo, typeLabel } from '../data/mock';
import { Note, PageHeader } from '../components/ui';
import type { Opportunity, Stage } from '../types';

const verified = new Set(['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o9', 'o10', 'o11']);

export default function Placements() {
  const { opportunities, update } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', organization: '', format: 'onsite', stage: 'do', capacity: 5, hours: 8 });

  const add = () => {
    if (!f.title || !f.organization) return;
    const o: Opportunity = {
      id: 'n' + Date.now(), title: f.title, organization: f.organization, type: f.stage === 'try' ? 'volunteer' : 'shadowing',
      format: f.format as 'onsite' | 'online', durationHours: f.hours, stage: f.stage as Stage, skills: ['comm'], interestTags: [],
      supervisionNote: 'รอตรวจสอบความปลอดภัย', mentorId: 'm6', capacity: f.capacity, description: '', schedule: 'รอกำหนด', expect: [], location: f.format === 'online' ? 'ออนไลน์' : 'รอกำหนด',
    };
    update((s) => ({ ...s, extraOpportunities: [...s.extraOpportunities, o] }));
    setOpen(false);
    setF({ ...f, title: '', organization: '' });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="จัดการกิจกรรมเรียนรู้ภาคสนาม" sub="พันธมิตร: ผู้ปกครอง ศิษย์เก่า ธุรกิจในชุมชน และมหาวิทยาลัย">
        <button className="btn-accent" onClick={() => setOpen(!open)}><Plus className="h-4 w-4" />เพิ่มกิจกรรม</button>
      </PageHeader>
      {open && (
        <section className="card grid gap-3 sm:grid-cols-2">
          <label>ชื่อกิจกรรม<input className="input mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label>องค์กรพันธมิตร<input className="input mt-1" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></label>
          <label>รูปแบบ<select className="input mt-1" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}><option value="onsite">ในพื้นที่</option><option value="online">ออนไลน์</option></select></label>
          <label>ช่วง<select className="input mt-1" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>{(Object.keys(stageInfo) as Stage[]).map((k) => <option key={k} value={k}>{stageInfo[k].th} ({stageInfo[k].grades})</option>)}</select></label>
          <label>จำนวนที่รับ<input type="number" min={1} className="input mt-1" value={f.capacity} onChange={(e) => setF({ ...f, capacity: +e.target.value })} /></label>
          <label>ชั่วโมงรวม<input type="number" min={1} className="input mt-1" value={f.hours} onChange={(e) => setF({ ...f, hours: +e.target.value })} /></label>
          <div className="sm:col-span-2"><Note tone="amber">ม.3 อายุประมาณ 14–15 ปี ทุกกิจกรรมต้องเป็นการเรียนรู้ภาคสนาม ไม่ใช่การจ้างงาน และต้องมีพี่เลี้ยงดูแล</Note></div>
          <button className="btn-primary sm:col-span-2" onClick={add}>บันทึกกิจกรรม</button>
        </section>
      )}
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left"><th className="py-2">กิจกรรม</th><th>ประเภท</th><th>ช่วง</th><th>รูปแบบ</th><th>ที่รับ</th><th>การดูแล</th></tr></thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id} className="border-t border-navy/10">
                <td className="py-2.5"><p className="font-semibold">{o.title}</p><p className="text-ink">{o.organization}</p></td>
                <td>{typeLabel[o.type]}</td>
                <td>{stageInfo[o.stage].th}</td>
                <td>{o.format === 'online' ? 'ออนไลน์' : 'ในพื้นที่'}</td>
                <td>{o.capacity}</td>
                <td>{verified.has(o.id)
                  ? <span className="chip bg-leaf/20"><ShieldCheck className="h-4 w-4" aria-hidden />ตรวจแล้ว</span>
                  : <span className="chip bg-amber/30"><ShieldAlert className="h-4 w-4" aria-hidden />รอตรวจสถานที่</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
