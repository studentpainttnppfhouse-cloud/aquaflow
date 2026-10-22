import { useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { skillAreas, skillSnapshots, levelLabel } from '../data/mock';
import { Note, PageHeader, SkillChip } from '../components/ui';
import { Palette } from '../components/Palette';

export default function Portfolio() {
  const { s, update, experiences, opportunities, student } = useStore();
  const [exported, setExported] = useState(false);
  if (student.grade !== 12) return <Note>Portfolio Builder เปิดให้ใช้ตอน ม.6 ลองสลับเป็นน้องภูมิ (ม.6) จากแถบด้านบนเพื่อดูตัวอย่าง</Note>;

  const order = s.portfolioOrder.filter((id) => experiences.some((e) => e.id === id));
  const setOrder = (o: string[]) => update((x) => ({ ...x, portfolioOrder: o }));
  const move = (i: number, d: number) => { const o = [...order]; [o[i], o[i + d]] = [o[i + d], o[i]]; setOrder(o); };
  const exp = (id: string) => experiences.find((e) => e.id === id)!;
  const title = (id: string) => opportunities.find((o) => o.id === exp(id).opportunityId)?.title;
  const snap = skillSnapshots.find((x) => x.studentId === student.id && x.grade === 12)!;

  return (
    <div className="space-y-6">
      <PageHeader title="Portfolio Builder" sub="ระบบรวบรวมประสบการณ์ 6 ปีให้แล้ว คุณเลือกและเรียงเองว่าจะเล่าเรื่องไหน" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card min-w-0 space-y-3">
          <h2 className="h2">ไฮไลต์ที่เลือก ({order.length})</h2>
          <ol className="space-y-2">
            {order.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-xl bg-navy/5 p-2">
                <span className="w-6 text-center font-bold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{title(id)}</span>
                <button aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button aria-label="เลื่อนลง" disabled={i === order.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button aria-label="เอาออก" onClick={() => setOrder(order.filter((x) => x !== id))} className="rounded p-1 hover:bg-white"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ol>
          <h3 className="pt-2 font-semibold">ประสบการณ์อื่น ๆ</h3>
          <ul className="space-y-2">
            {experiences.filter((e) => !order.includes(e.id)).map((e) => (
              <li key={e.id} className="flex items-center gap-2 rounded-xl border border-navy/10 p-2">
                <span className="min-w-0 flex-1 truncate">{title(e.id)}</span>
                <button className="btn-ghost px-3 py-1 text-sm" onClick={() => setOrder([...order, e.id])}><Plus className="h-4 w-4" />เพิ่ม</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-4 border-t-8 border-sky" aria-label="ตัวอย่าง Portfolio">
          <p className="text-xs uppercase tracking-wide text-ink">ตัวอย่าง · รูปแบบ TCAS Portfolio (A4)</p>
          <div className="flex items-center gap-4">
            <div className="w-24 shrink-0"><Palette snap={snap} size={96} /></div>
            <div><h2 className="text-xl font-bold">ภูมิ · ม.6</h2><p className="text-sm text-ink">เทคโนโลยี × ธรรมชาติ × การแก้ปัญหา</p></div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {snap.skills.filter((x) => x.level === 'confident').map((x) => <SkillChip key={x.skillAreaId} id={x.skillAreaId} />)}
            <span className="chip text-ink">({levelLabel.confident})</span>
          </div>
          {order.map((id, i) => {
            const e = exp(id);
            return (
              <div key={id} className="border-l-4 pl-3" style={{ borderColor: skillAreas.find((a) => a.id === e.skillTags[0])?.color }}>
                <p className="font-semibold">{i + 1}. {title(id)} <span className="text-sm font-normal text-ink">({new Date(e.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })})</span></p>
                <p className="text-sm">{e.reflection}</p>
              </div>
            );
          })}
        </section>
      </div>
      <section className="card min-w-0 space-y-3">
        <button className="btn-accent" onClick={() => setExported(true)}><Download className="h-4 w-4" />ส่งออก PDF รูปแบบ TCAS (จำลอง)</button>
        {exported && <Note tone="green">สร้างไฟล์ portfolio_phum_tcas.pdf แล้ว (จำลอง ยังไม่มีไฟล์จริง)</Note>}
        <Note>ยังไม่ได้เชื่อมกับระบบ myTCAS จริง ระบบ myTCAS เป็นของ ทปอ. (ที่ประชุมอธิการบดีแห่งประเทศไทย) โครงการนี้ <b>เสนอความร่วมมือกับ ทปอ.</b> เพื่อให้ส่ง Portfolio ได้โดยตรงในอนาคต</Note>
      </section>
    </div>
  );
}
