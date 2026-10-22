import type { ReactNode } from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import { skillAreas } from '../data/mock';

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {sub && <p className="muted mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Note({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'amber' }) {
  const c = { blue: 'bg-sky/10 border-sky/30', green: 'bg-leaf/15 border-leaf/40', amber: 'bg-amber/15 border-amber/40' }[tone];
  return (
    <div className={`flex gap-2 rounded-xl border p-3 text-sm ${c}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-ink">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function SkillChip({ id }: { id: string }) {
  const a = skillAreas.find((x) => x.id === id);
  if (!a) return null;
  return (
    <span className="chip bg-navy/5 text-navy">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} aria-hidden />
      {a.name}
    </span>
  );
}

export function LearningBadge() {
  return <span className="chip bg-leaf/20 text-navy">เรียนรู้ภาคสนาม</span>;
}

export function Scale({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">{label}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={value === n} onClick={() => onChange(n)}
            className={`h-11 flex-1 rounded-xl border text-lg font-semibold transition ${value === n ? 'border-navy bg-navy text-cream' : 'border-navy/15 bg-white hover:bg-navy/5'}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${checked ? 'bg-leaf' : 'bg-navy/20'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      <span className="sr-only">{checked ? 'เปิด' : 'ปิด'}</span>
    </button>
  );
}
