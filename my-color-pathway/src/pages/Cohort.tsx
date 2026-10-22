import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cohort } from '../data/mock';
import { Note, PageHeader } from '../components/ui';

export default function Cohort() {
  const stats = [
    { label: 'นักเรียนในรุ่น', v: `${cohort.size} คน` },
    { label: 'เข้าร่วมกิจกรรมแล้ว', v: `${cohort.participation.at(-1)!.pct}%` },
    { label: 'อัปเดต Skill Profile ครบ', v: `${cohort.profileCompletion}%` },
    { label: 'ยินยอมแชร์ Well-being รายบุคคล', v: `${cohort.consentShared}%` },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="ภาพรวมรุ่น" sub={`${cohort.name} · ข้อมูลจำลอง`} />
      <Note>หน้านี้แสดงเฉพาะข้อมูลรวมแบบไม่ระบุตัวตน ครูจะไม่เห็นความเครียดของนักเรียนรายคน เว้นแต่นักเรียนและผู้ปกครองยินยอม และไม่มีการจัดอันดับนักเรียน</Note>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => <div key={s.label} className="card"><p className="text-2xl font-bold">{s.v}</p><p className="text-sm text-ink">{s.label}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">อัตราการเข้าร่วมสะสม (%)</h2>
          <div className="mt-3 h-64"><ResponsiveContainer>
            <BarChart data={cohort.participation} margin={{ left: -20 }}>
              <CartesianGrid stroke="#1C254112" vertical={false} /><XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip />
              <Bar dataKey="pct" name="เข้าร่วม (%)" fill="#F2A541" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </section>
        <section className="card">
          <h2 className="h2">Well-being เฉลี่ยของรุ่น (1–5, ไม่ระบุตัวตน)</h2>
          <div className="mt-3 h-64"><ResponsiveContainer>
            <LineChart data={cohort.wellbeingAvg} margin={{ left: -20, right: 10 }}>
              <CartesianGrid stroke="#1C254112" /><XAxis dataKey="month" /><YAxis domain={[1, 5]} /><Tooltip /><Legend />
              <Line dataKey="stress" name="ความกังวลเรื่องอนาคต" stroke="#E4572E" strokeWidth={3} strokeDasharray="6 4" />
              <Line dataKey="confidence" name="ความมั่นใจ" stroke="#3A7CA5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer></div>
        </section>
      </div>
    </div>
  );
}
