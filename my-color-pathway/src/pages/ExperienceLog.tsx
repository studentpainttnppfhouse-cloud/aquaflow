import { Link } from 'react-router-dom';
import { Image, MessageSquareHeart, PenLine } from 'lucide-react';
import { useStore } from '../lib/store';
import { mentorFeedback, mentors } from '../data/mock';
import { PageHeader, SkillChip } from '../components/ui';

export default function ExperienceLog() {
  const { experiences, opportunities } = useStore();
  return (
    <div>
      <PageHeader title="บันทึกประสบการณ์" sub="ทุกอย่างที่คุณได้ลอง เรียงจากล่าสุด">
        <Link to="/reflect" className="btn-accent"><PenLine className="h-4 w-4" />เขียนสะท้อนคิดใหม่</Link>
      </PageHeader>
      <ol className="relative space-y-5 border-l-2 border-navy/10 pl-5 sm:pl-6">
        {experiences.map((e) => {
          const o = opportunities.find((x) => x.id === e.opportunityId);
          const f = mentorFeedback.find((x) => x.id === e.mentorFeedbackId);
          const m = f && mentors.find((x) => x.id === f.mentorId);
          return (
            <li key={e.id} className="relative">
              <span className="absolute -left-[29px] top-6 h-4 w-4 rounded-full border-4 border-cream bg-orange sm:-left-[33px]" aria-hidden />
              <article className="card space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="h2">{o?.title}</h2>
                  <time className="text-sm text-ink">{new Date(e.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                </div>
                <p className="text-sm text-ink">{o?.organization}</p>
                <div className="flex flex-wrap gap-2">
                  {e.evidence.map((ev) => (
                    <div key={ev.label} className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl p-2 text-center text-xs font-medium" style={{ background: ev.color + '33' }}>
                      <Image className="h-5 w-5" aria-hidden />{ev.label}
                    </div>
                  ))}
                </div>
                <blockquote className="border-l-4 border-amber pl-3 italic">“{e.reflection}”</blockquote>
                <p className="text-sm text-ink">ความสนุก {e.enjoyment}/5 · พลังงาน {e.energy}/5 (ความรู้สึกของคุณเอง)</p>
                <div className="flex flex-wrap gap-1.5">{e.skillTags.map((k) => <SkillChip key={k} id={k} />)}</div>
                {f && (
                  <div className="rounded-xl bg-leaf/15 p-3 text-sm">
                    <p className="flex items-center gap-1 font-semibold"><MessageSquareHeart className="h-4 w-4" aria-hidden />จาก{m?.name} ({m?.role})</p>
                    <p className="mt-1"><b>จุดแข็งที่เห็น:</b> {f.strengths.join(' · ')}</p>
                    <p><b>ลองพัฒนาต่อ:</b> {f.growthAreas.join(' · ')}</p>
                    <p className="mt-1 italic">“{f.note}”</p>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
