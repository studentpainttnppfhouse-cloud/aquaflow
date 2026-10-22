import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { skillAreas } from '../data/mock';
import { PageHeader, PrivacyNote, Scale } from '../components/ui';

const prompts = [
  { k: 'self', q: 'ช่วงไหนที่รู้สึกเป็นตัวเองมากที่สุด?' },
  { k: 'hard', q: 'อะไรยากที่สุด?' },
  { k: 'next', q: 'อยากลองอะไรต่อ?' },
];

export default function Reflect() {
  const { oppId } = useParams();
  const { opportunities, student, update } = useStore();
  const nav = useNavigate();
  const [opp, setOpp] = useState(oppId || opportunities[0].id);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [enjoy, setEnjoy] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState<string[]>([]);

  const save = () => {
    update((s) => ({
      ...s,
      extraExperiences: [...s.extraExperiences, {
        id: 'x' + Date.now(), studentId: student.id, opportunityId: opp, date: new Date().toISOString().slice(0, 10),
        reflection: prompts.map((p) => ans[p.k]).filter(Boolean).join(' ') || 'ยังไม่ได้เขียน', enjoyment: enjoy, energy, skillTags: tags, evidence: [],
      }],
    }));
    nav('/log');
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="สะท้อนคิดหลังกิจกรรม" sub="ใช้เวลาแค่ 3 นาที ไม่มีคำตอบที่ผิด" />
      <div className="card space-y-5">
        <label className="block">
          <span className="font-semibold">กิจกรรมที่เพิ่งทำ</span>
          <select className="input mt-1" value={opp} onChange={(e) => setOpp(e.target.value)}>
            {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        </label>
        {prompts.map((p) => (
          <label key={p.k} className="block">
            <span className="font-semibold">{p.q}</span>
            <textarea className="input mt-1" rows={2} value={ans[p.k] ?? ''} onChange={(e) => setAns({ ...ans, [p.k]: e.target.value })} placeholder="เขียนสั้น ๆ ก็พอ" />
          </label>
        ))}
        <Scale label="สนุกแค่ไหน" value={enjoy} onChange={setEnjoy} low="ไม่ค่อย" high="สนุกมาก" />
        <Scale label="หลังทำแล้วรู้สึกมีพลังแค่ไหน" value={energy} onChange={setEnergy} low="หมดแรง" high="มีพลังขึ้น" />
        <fieldset>
          <legend className="font-semibold">วันนี้ได้ใช้ทักษะไหนบ้าง</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {skillAreas.map((a) => {
              const on = tags.includes(a.id);
              return (
                <button key={a.id} type="button" aria-pressed={on} onClick={() => setTags(on ? tags.filter((t) => t !== a.id) : [...tags, a.id])}
                  className={`chip border-2 px-3 py-1.5 ${on ? 'bg-navy/5' : 'bg-white'}`} style={{ borderColor: a.color }}>
                  {on ? <Check className="h-4 w-4" aria-hidden /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} aria-hidden />}{a.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <PrivacyNote>บันทึกนี้จะแชร์ตามที่คุณตั้งไว้ในหน้า “ความเป็นส่วนตัว” เท่านั้น</PrivacyNote>
        <button className="btn-primary w-full" onClick={save}>บันทึก</button>
      </div>
    </div>
  );
}
