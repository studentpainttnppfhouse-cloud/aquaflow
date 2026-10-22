import { useState } from 'react';
import { Bookmark, BookmarkCheck, Columns2, Lightbulb, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { programSuggestions } from '../data/mock';
import { Note, PageHeader, SkillChip } from '../components/ui';
import type { ProgramSuggestion } from '../types';

export default function Programs() {
  const { s, update, student, opportunities, experiences } = useStore();
  const [compare, setCompare] = useState<string[]>([]);
  if (student.grade !== 12) return <Note>ข้อเสนอสาขาเปิดตอน ม.6 ลองสลับเป็นน้องภูมิ (ม.6) จากแถบด้านบน</Note>;

  const visible = programSuggestions.filter((p) => !s.dismissedPrograms.includes(p.id));
  const toggle = (k: 'savedPrograms' | 'dismissedPrograms', id: string) =>
    update((x) => ({ ...x, [k]: x[k].includes(id) ? x[k].filter((y) => y !== id) : [...x[k], id] }));
  const expTitle = (id?: string) => {
    const e = experiences.find((x) => x.id === id);
    return e && opportunities.find((o) => o.id === e.opportunityId)?.title;
  };

  const Card = ({ p }: { p: ProgramSuggestion }) => {
    const saved = s.savedPrograms.includes(p.id);
    return (
      <article className="card space-y-3">
        <div>
          <h3 className="h2">{p.program}</h3>
          <p className="text-sm text-ink">{p.faculty} · {p.university}</p>
        </div>
        <div>
          <p className="font-semibold">ทำไมอาจเหมาะกับคุณ</p>
          <ul className="mt-1 space-y-1 text-sm">
            {p.reasons.map((r) => <li key={r.text}>• {r.text}{r.experienceId && <span className="text-ink"> (จาก “{expTitle(r.experienceId)}”)</span>}</li>)}
          </ul>
        </div>
        <div className="flex flex-wrap gap-1.5">{p.fitTags.map((t) => <SkillChip key={t} id={t} />)}</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost px-3 py-1.5 text-sm" aria-pressed={saved} onClick={() => toggle('savedPrograms', p.id)}>
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
          <button className="btn-ghost px-3 py-1.5 text-sm" aria-pressed={compare.includes(p.id)}
            onClick={() => setCompare(compare.includes(p.id) ? compare.filter((x) => x !== p.id) : [...compare, p.id].slice(-3))}>
            <Columns2 className="h-4 w-4" />{compare.includes(p.id) ? 'อยู่ในการเปรียบเทียบ' : 'เปรียบเทียบ'}
          </button>
          <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => toggle('dismissedPrograms', p.id)}><X className="h-4 w-4" />ไม่สนใจ</button>
        </div>
      </article>
    );
  };

  const cmp = programSuggestions.filter((p) => compare.includes(p.id));
  return (
    <div className="space-y-6">
      <PageHeader title="สาขาที่อาจเหมาะกับคุณ" sub="มาจากประสบการณ์ 6 ปีของคุณเอง ไม่ได้มาจากคะแนนสอบ" />
      <div className="rounded-2xl border-2 border-navy bg-white p-4">
        <p className="text-lg font-bold">ระบบเป็นเพียงข้อเสนอแนะ การตัดสินใจเป็นของคุณ</p>
        <p className="text-sm text-ink">คุณจะเลือกสาขาที่ไม่อยู่ในรายการนี้ก็ได้เสมอ ลองคุยกับครอบครัวและครูแนะแนวประกอบด้วย</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">{visible.filter((p) => !p.unexpected).map((p) => <Card key={p.id} p={p} />)}</section>
      <section>
        <h2 className="h2 mb-3 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber" aria-hidden />สาขาที่คุณอาจยังไม่เคยนึกถึง</h2>
        <div className="grid gap-4 md:grid-cols-2">{visible.filter((p) => p.unexpected).map((p) => <Card key={p.id} p={p} />)}</div>
      </section>
      {s.dismissedPrograms.length > 0 && (
        <button className="text-sm underline" onClick={() => update((x) => ({ ...x, dismissedPrograms: [] }))}>แสดงสาขาที่ซ่อนไว้ ({s.dismissedPrograms.length})</button>
      )}
      {cmp.length > 1 && (
        <section className="card overflow-x-auto">
          <h2 className="h2 mb-3">เปรียบเทียบ</h2>
          <table className="w-full min-w-[520px] text-sm">
            <tbody>
              <tr><th className="w-28 py-2 text-left">สาขา</th>{cmp.map((p) => <td key={p.id} className="p-2 font-semibold">{p.program}</td>)}</tr>
              <tr className="border-t border-navy/10"><th className="py-2 text-left">มหาวิทยาลัย</th>{cmp.map((p) => <td key={p.id} className="p-2">{p.university}</td>)}</tr>
              <tr className="border-t border-navy/10"><th className="py-2 text-left">ทักษะที่ใช้</th>{cmp.map((p) => <td key={p.id} className="p-2"><div className="flex flex-wrap gap-1">{p.fitTags.map((t) => <SkillChip key={t} id={t} />)}</div></td>)}</tr>
              <tr className="border-t border-navy/10"><th className="py-2 text-left">เหตุผล</th>{cmp.map((p) => <td key={p.id} className="p-2">{p.reasons.map((r) => r.text).join(' · ')}</td>)}</tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
