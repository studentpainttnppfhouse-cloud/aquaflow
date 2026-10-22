import { useState } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { useStore, type Sharing } from '../lib/store';
import { consentRecords } from '../data/mock';
import { Note, PageHeader, Toggle } from '../components/ui';

const who: { k: keyof Sharing; label: string; note?: string }[] = [
  { k: 'parent', label: 'ผู้ปกครอง' },
  { k: 'teacher', label: 'ครู / ผู้ประสานงาน' },
  { k: 'mentor', label: 'พี่เลี้ยง' },
  { k: 'university', label: 'มหาวิทยาลัย', note: 'ในอนาคต ผ่าน Portfolio ที่คุณส่งเองเท่านั้น' },
];
const what = [
  { k: 'journey', label: 'เส้นทางและกิจกรรม' },
  { k: 'skills', label: 'Skill Profile' },
  { k: 'reflections', label: 'บันทึกสะท้อนคิด' },
  { k: 'wellbeing', label: 'เช็กใจ (Well-being)' },
];

export default function Privacy() {
  const { sharing, student, update } = useStore();
  const [msg, setMsg] = useState('');
  const consent = consentRecords.find((c) => c.studentId === student.id);
  const set = (w: keyof Sharing, k: string, v: boolean) =>
    update((s) => ({ ...s, sharing: { ...s.sharing, [student.id]: { ...sharing, [w]: { ...sharing[w], [k]: v } } } }));

  return (
    <div className="space-y-6">
      <PageHeader title="ความเป็นส่วนตัวและการแชร์" sub="ข้อมูลเป็นของคุณ คุณเลือกเองว่าใครเห็นอะไร (ตาม PDPA)" />
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr><th className="py-2 text-left">ใครเห็นได้</th>{what.map((w) => <th key={w.k} className="px-2 font-semibold">{w.label}</th>)}</tr></thead>
          <tbody>
            {who.map((w) => (
              <tr key={w.k} className="border-t border-navy/10">
                <th scope="row" className="py-3 text-left font-semibold">{w.label}{w.note && <span className="block text-xs font-normal text-ink">{w.note}</span>}</th>
                {what.map((x) => (
                  <td key={x.k} className="px-2 text-center">
                    <Toggle checked={!!sharing[w.k][x.k]} onChange={(v) => set(w.k, x.k, v)} label={`${w.label} เห็น ${x.label}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-ink">Well-being ปิดไว้เป็นค่าเริ่มต้นสำหรับทุกคน ครูเห็นเพียงค่าเฉลี่ยรวมของรุ่นแบบไม่ระบุตัวตน</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-2">
          <h2 className="h2">บันทึกความยินยอม</h2>
          {consent && (
            <div className="flex gap-3 rounded-xl bg-leaf/15 p-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
              <div><p className="font-semibold">{consent.parentName} · {consent.date}</p><ul className="list-disc pl-5 text-sm">{consent.scope.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
          )}
        </section>
        <section className="card space-y-3">
          <h2 className="h2">ข้อมูลของฉัน</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => setMsg('สร้างไฟล์ข้อมูลทั้งหมดของคุณแล้ว (จำลอง)')}><Download className="h-4 w-4" />ดาวน์โหลดข้อมูล</button>
            <button className="btn-ghost" onClick={() => setMsg('ส่งคำขอลบข้อมูลแล้ว ผู้ปกครองจะได้รับแจ้งเพื่อยืนยัน (จำลอง)')}><Trash2 className="h-4 w-4" />ขอลบข้อมูล</button>
          </div>
          {msg && <Note tone="green">{msg}</Note>}
        </section>
      </div>
    </div>
  );
}
