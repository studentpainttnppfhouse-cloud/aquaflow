import { useState } from 'react';
import { Send } from 'lucide-react';
import { mentors, students, opportunities, gradeLabel } from '../data/mock';
import { Note, PageHeader } from '../components/ui';

const mentees = [
  { studentId: 's1', opp: 'o4', status: 'รอความเห็นจากคุณ' },
  { studentId: 's2', opp: 'o4', status: 'ส่งความเห็นแล้ว' },
  { studentId: 'x', name: 'น้องเฟิร์น', grade: 10, opp: 'o4', status: 'กำลังเรียนรู้ (วันที่ 2/4)' },
];

export default function Mentor() {
  const me = mentors[0];
  const [sel, setSel] = useState(0);
  const [form, setForm] = useState({ strengths: '', growth: '', note: '' });
  const [sent, setSent] = useState<number[]>([1]);
  const m = mentees[sel];
  const st = students.find((x) => x.id === m.studentId);
  const name = st ? `น้อง${st.nickname}` : m.name;
  const grade = st ? st.grade : m.grade!;

  return (
    <div className="space-y-6">
      <PageHeader title={`สวัสดี ${me.name}`} sub={`${me.role} · ${me.organization}`} />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section className="card h-fit space-y-2">
          <h2 className="h2">น้อง ๆ ของฉัน</h2>
          {mentees.map((x, i) => {
            const s2 = students.find((y) => y.id === x.studentId);
            return (
              <button key={i} onClick={() => { setSel(i); setForm({ strengths: '', growth: '', note: '' }); }}
                className={`w-full rounded-xl p-3 text-left ${sel === i ? 'bg-navy text-cream' : 'bg-navy/5 hover:bg-navy/10'}`}>
                <p className="font-semibold">{s2 ? `น้อง${s2.nickname}` : x.name} · {gradeLabel(s2 ? s2.grade : x.grade!)}</p>
                <p className="text-sm opacity-80">{sent.includes(i) ? 'ส่งความเห็นแล้ว' : x.status}</p>
              </button>
            );
          })}
        </section>
        <section className="card space-y-4">
          <div>
            <h2 className="h2">ความเห็นสำหรับ{name} ({gradeLabel(grade)})</h2>
            <p className="text-sm text-ink">{opportunities.find((o) => o.id === m.opp)?.title}</p>
          </div>
          <Note tone="green">ไม่มีการให้คะแนนหรือเกรด เขียนสิ่งที่คุณเห็นจริง ๆ เพื่อช่วยให้น้องรู้จักตัวเอง</Note>
          {sent.includes(sel) ? <Note tone="green">ส่งความเห็นถึง{name}แล้ว ขอบคุณที่สละเวลานะ</Note> : (
            <>
              <label className="block"><span className="font-semibold">จุดแข็งที่เห็น</span>
                <textarea className="input mt-1" rows={3} value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} placeholder="เช่น กล้าถามลูกค้าว่าต้องการอะไรจริง ๆ" /></label>
              <label className="block"><span className="font-semibold">สิ่งที่น่าลองพัฒนาต่อ</span>
                <textarea className="input mt-1" rows={3} value={form.growth} onChange={(e) => setForm({ ...form, growth: e.target.value })} placeholder="เช่น ลองร่างหลาย ๆ แบบก่อนเลือก" /></label>
              <label className="block"><span className="font-semibold">ข้อความให้กำลังใจ</span>
                <textarea className="input mt-1" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              <button className="btn-primary" onClick={() => setSent([...sent, sel])}><Send className="h-4 w-4" />ส่งความเห็น</button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
