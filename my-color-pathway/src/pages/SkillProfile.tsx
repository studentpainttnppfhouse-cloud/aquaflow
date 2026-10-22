import { useState } from 'react';
import { BellRing, Compass } from 'lucide-react';
import { useStore } from '../lib/store';
import { fieldsThatMaySuit, gradeLabel, levelLabel, levelValue, skillAreas, skillSnapshots } from '../data/mock';
import { Palette } from '../components/Palette';
import { Note, PageHeader } from '../components/ui';

export default function SkillProfile() {
  const { student, experiences, opportunities } = useStore();
  const snaps = skillSnapshots.filter((x) => x.studentId === student.id);
  const [g, setG] = useState(student.grade);
  const snap = snaps.find((x) => x.grade === g) ?? snaps[snaps.length - 1];
  const [focus, setFocus] = useState(skillAreas[0].id);
  const evidence = experiences.filter((e) => e.skillTags.includes(focus));

  return (
    <div className="space-y-6">
      <PageHeader title={`สีของน้อง${student.nickname}`} sub="Skill Profile ของคุณคนเดียว ไม่มีคะแนน ไม่มีอันดับ ไม่เทียบกับใคร" />
      <Note tone="amber"><span className="inline-flex items-center gap-1 font-semibold"><BellRing className="h-4 w-4" aria-hidden />ถึงเวลาอัปเดตประจำปี</span> สะท้อนคิด 1 ครั้ง และขอความเห็นจากพี่เลี้ยง 1 คน เพื่อเติมสีของปีนี้</Note>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="card flex flex-col items-center gap-4">
          <Palette snap={snap} size={280} />
          <div className="flex flex-wrap justify-center gap-1" role="tablist" aria-label="เลือกชั้นปี">
            {snaps.map((x) => (
              <button key={x.grade} role="tab" aria-selected={x.grade === g} onClick={() => setG(x.grade)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${x.grade === g ? 'bg-navy text-cream' : 'bg-navy/5'}`}>{gradeLabel(x.grade)}</button>
            ))}
          </div>
          <p className="text-center text-sm text-ink">กลีบยาวขึ้นเมื่อคุณมั่นใจในทักษะนั้นมากขึ้น ดูว่าสีของคุณเติบโตอย่างไรตั้งแต่ ม.1</p>
        </section>

        <section className="card">
          <h2 className="h2">การเติบโตของฉัน</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="py-1 text-left font-semibold">ทักษะ</th>{snaps.map((x) => <th key={x.grade} className="px-1 font-semibold">{gradeLabel(x.grade)}</th>)}</tr></thead>
              <tbody>
                {skillAreas.map((a) => (
                  <tr key={a.id} className={`cursor-pointer ${focus === a.id ? 'bg-navy/5' : ''}`} onClick={() => setFocus(a.id)}>
                    <th scope="row" className="py-2 text-left font-normal">
                      <button className="flex items-center gap-2 text-left" onClick={() => setFocus(a.id)}><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />{a.name}</button>
                    </th>
                    {snaps.map((x) => {
                      const lv = x.skills.find((s) => s.skillAreaId === a.id)!.level;
                      const v = levelValue[lv];
                      return (
                        <td key={x.grade} className="px-1 text-center" title={levelLabel[lv]}>
                          <span className="mx-auto block rounded-full" style={{ width: 6 + v * 5, height: 6 + v * 5, background: a.color, opacity: 0.35 + v * 0.2 }} aria-hidden />
                          <span className="sr-only">{levelLabel[lv]}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink">ขนาดจุด: เล็ก = กำลังสำรวจ · กลาง = กำลังเติบโต · ใหญ่ = มั่นใจ</p>
        </section>
      </div>

      <section className="card">
        <h2 className="h2">หลักฐานของ “{skillAreas.find((a) => a.id === focus)?.name}”</h2>
        <p className="text-sm text-ink">{skillAreas.find((a) => a.id === focus)?.description}</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {evidence.map((e) => (
            <li key={e.id} className="rounded-xl bg-navy/5 p-3">
              <p className="font-semibold">{opportunities.find((o) => o.id === e.opportunityId)?.title}</p>
              <p className="text-sm italic">“{e.reflection}”</p>
            </li>
          ))}
          {evidence.length === 0 && <li className="text-ink">ยังไม่มีหลักฐาน ลองหากิจกรรมที่ได้ฝึกทักษะนี้ดูไหม</li>}
        </ul>
      </section>

      <section className="card">
        <h2 className="h2 flex items-center gap-2"><Compass className="h-5 w-5 text-sky" aria-hidden />สาขาที่อาจเหมาะกับคุณ</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {fieldsThatMaySuit[student.id].map((f) => (
            <li key={f.name} className="rounded-xl border border-navy/10 p-3"><p className="font-semibold">{f.name}</p><p className="text-sm text-ink">เพราะ{f.why}</p></li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink">ระบบเป็นเพียงข้อเสนอแนะ การตัดสินใจเป็นของคุณ</p>
      </section>
    </div>
  );
}
