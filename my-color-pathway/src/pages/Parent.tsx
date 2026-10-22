import { Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store';
import { consentRecords, gradeLabel, skillSnapshots, stageInfo } from '../data/mock';
import { Palette } from '../components/Palette';
import { Note, PageHeader } from '../components/ui';

export default function Parent() {
  const { student, sharing, experiences, opportunities } = useStore();
  const sh = sharing.parent;
  const consent = consentRecords.find((c) => c.studentId === student.id);
  const snap = skillSnapshots.filter((x) => x.studentId === student.id).at(-1)!;
  const Hidden = ({ what }: { what: string }) => (
    <p className="flex items-center gap-2 text-ink"><Lock className="h-4 w-4" aria-hidden />น้อง{student.nickname}ยังไม่ได้แชร์{what}</p>
  );
  return (
    <div className="space-y-6">
      <PageHeader title={`เส้นทางของน้อง${student.nickname}`} sub={`${gradeLabel(student.grade)} · ช่วง “${stageInfo[student.stage].th}”`} />
      <Note>คุณเห็นเฉพาะส่วนที่ลูกเลือกแชร์ ข้อมูลเป็นของลูก การตัดสินใจเรื่องอนาคตก็เป็นของลูกเช่นกัน</Note>
      <section className="card space-y-3">
        <h2 className="h2">การให้ความยินยอม</h2>
        {consent && (
          <div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-leaf" aria-hidden />
            <div><p className="font-semibold">คุณ ({consent.parentName}) ยินยอมแล้ว · {consent.date}</p>
              <ul className="list-disc pl-5 text-sm">{consent.scope.map((x) => <li key={x}>{x}</li>)}</ul></div></div>
        )}
        <div className="flex flex-wrap gap-2"><button className="btn-ghost">แก้ไขขอบเขตความยินยอม</button><button className="btn-ghost">ถอนความยินยอม</button></div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">สีของลูก (Skill Profile)</h2>
          {sh.skills ? <div className="mt-3 flex justify-center"><Palette snap={snap} size={220} /></div> : <Hidden what=" Skill Profile" />}
        </section>
        <section className="card space-y-2">
          <h2 className="h2">กิจกรรมที่ทำแล้ว</h2>
          {sh.journey ? experiences.map((e) => (
            <div key={e.id} className="rounded-xl bg-navy/5 p-3">
              <p className="font-semibold">{opportunities.find((o) => o.id === e.opportunityId)?.title}</p>
              {sh.reflections ? <p className="text-sm italic">“{e.reflection}”</p> : <p className="text-sm text-ink">บันทึกสะท้อนคิดเป็นส่วนตัว</p>}
            </div>
          )) : <Hidden what="กิจกรรม" />}
        </section>
      </div>
      <section className="card"><h2 className="h2">Well-being</h2>{sh.wellbeing ? <p>ลูกแชร์ข้อมูลนี้กับคุณ</p> : <Hidden what="ข้อมูลความรู้สึก (ซึ่งเป็นค่าเริ่มต้นที่เราแนะนำ)" />}</section>
    </div>
  );
}
