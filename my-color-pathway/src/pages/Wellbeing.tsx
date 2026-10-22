import { useState } from 'react';
import { Coffee, MessageCircle, Phone } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store';
import { Note, PageHeader, PrivacyNote, Scale } from '../components/ui';

const moods = ['😣', '😕', '😐', '🙂', '😄'];

export default function Wellbeing() {
  const { checkins, student, update } = useStore();
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [conf, setConf] = useState(3);
  const [done, setDone] = useState(false);

  const submit = () => {
    update((s) => ({ ...s, extraCheckins: [...s.extraCheckins, { studentId: student.id, date: 'วันนี้', stress, confidence: conf, private: true }] }));
    setDone(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ใจฉันวันนี้" sub="เช็กใจตัวเองแบบส่วนตัว ใช้เวลา 30 วินาที" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-5">
          <fieldset>
            <legend className="font-semibold">วันนี้รู้สึกอย่างไร</legend>
            <div className="mt-2 flex justify-between gap-2">
              {moods.map((m, i) => (
                <button key={i} type="button" aria-pressed={mood === i + 1} aria-label={`ระดับ ${i + 1}`} onClick={() => setMood(i + 1)}
                  className={`h-12 flex-1 rounded-xl text-2xl ${mood === i + 1 ? 'bg-amber/40 ring-2 ring-navy' : 'bg-navy/5'}`}>{m}</button>
              ))}
            </div>
          </fieldset>
          <Scale label="กังวลเรื่องอนาคตแค่ไหน" value={stress} onChange={setStress} low="สบายใจ" high="กังวลมาก" />
          <Scale label="มั่นใจในตัวเองแค่ไหน" value={conf} onChange={setConf} low="ยังไม่ค่อย" high="มั่นใจ" />
          {done ? <Note tone="green">บันทึกแล้ว ขอบคุณที่ดูแลใจตัวเองนะ</Note> : <button className="btn-primary w-full" onClick={submit}>บันทึก (ส่วนตัว)</button>}
          <PrivacyNote>ข้อมูลนี้เป็นส่วนตัวโดยค่าเริ่มต้น ไม่มีใครเห็น ไม่ถูกนำไปเทียบกับเพื่อน ครูเห็นเพียงค่าเฉลี่ยรวมของทั้งรุ่นแบบไม่ระบุตัวตน</PrivacyNote>
        </section>
        <section className="card">
          <h2 className="h2">ความรู้สึกของฉันตามเวลา</h2>
          <p className="text-sm text-ink">เทียบกับตัวเองเท่านั้น</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer>
              <LineChart data={checkins} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid stroke="#1C254112" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stress" name="ความกังวล" stroke="#E4572E" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="confidence" name="ความมั่นใจ" stroke="#3A7CA5" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="card">
        <h2 className="h2">ถ้าวันนี้หนักไป</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-navy/5 p-3"><MessageCircle className="mb-1 h-5 w-5 text-sky" aria-hidden /><p className="font-semibold">คุยกับครูแนะแนว</p><p className="text-sm text-ink">นัดคุยแบบส่วนตัวได้ทุกวันพุธ (จำลอง)</p></div>
          <div className="rounded-xl bg-navy/5 p-3"><Coffee className="mb-1 h-5 w-5 text-amber" aria-hidden /><p className="font-semibold">พักสักหน่อย</p><p className="text-sm text-ink">ไม่ต้องรีบหาคำตอบ เส้นทางนี้ยาว 6 ปี</p></div>
          <div className="rounded-xl bg-navy/5 p-3"><Phone className="mb-1 h-5 w-5 text-leaf" aria-hidden /><p className="font-semibold">สายด่วนสุขภาพจิต 1323</p><p className="text-sm text-ink">โทรฟรี 24 ชั่วโมง</p></div>
        </div>
      </section>
    </div>
  );
}
