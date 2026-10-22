import { skillAreas, levelLabel, levelValue } from '../data/mock';
import type { SkillSnapshot } from '../types';

/** The student's "color": one petal per skill area, petal length = own level. No numbers, no comparison. */
export function Palette({ snap, size = 260 }: { snap: SkillSnapshot; size?: number }) {
  const c = size / 2;
  const n = skillAreas.length;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img"
      aria-label={'สีของฉัน: ' + snap.skills.map((s) => `${skillAreas.find((a) => a.id === s.skillAreaId)?.name} ${levelLabel[s.level]}`).join(', ')}>
      {[1, 2, 3].map((r) => <circle key={r} cx={c} cy={c} r={(c - 10) * (r / 3)} fill="none" stroke="#1C2541" strokeOpacity={0.07} />)}
      {snap.skills.map((s, i) => {
        const a = skillAreas.find((x) => x.id === s.skillAreaId)!;
        const len = (c - 10) * (levelValue[s.level] / 3);
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const w = 0.42;
        const p = (r: number, d: number) => `${c + r * Math.cos(ang + d)},${c + r * Math.sin(ang + d)}`;
        return (
          <path key={a.id} d={`M${c},${c} Q${p(len * 0.75, -w)} ${p(len, 0)} Q${p(len * 0.75, w)} ${c},${c}Z`}
            fill={a.color} fillOpacity={0.85} stroke="white" strokeWidth={2} />
        );
      })}
      <circle cx={c} cy={c} r={10} fill="#F8F5EF" stroke="#1C2541" strokeOpacity={0.15} />
    </svg>
  );
}
