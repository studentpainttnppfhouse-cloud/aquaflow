import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Experience, Opportunity, Role, WellbeingCheckin } from '../types';
import { experiences as baseExperiences, opportunities as baseOpportunities, students, wellbeing as baseWellbeing } from '../data/mock';

export interface Sharing {
  parent: Record<string, boolean>;
  teacher: Record<string, boolean>;
  mentor: Record<string, boolean>;
  university: Record<string, boolean>;
}

interface State {
  role: Role;
  studentId: string;
  onboarded: Record<string, boolean>;
  applied: string[];
  savedPrograms: string[];
  dismissedPrograms: string[];
  extraExperiences: Experience[];
  extraCheckins: WellbeingCheckin[];
  extraOpportunities: Opportunity[];
  portfolioOrder: string[];
  sharing: Record<string, Sharing>;
}

const defaultSharing = (): Sharing => ({
  parent: { journey: true, skills: true, reflections: false, wellbeing: false },
  teacher: { journey: true, skills: true, reflections: true, wellbeing: false },
  mentor: { journey: false, skills: true, reflections: false, wellbeing: false },
  university: { journey: false, skills: false, reflections: false, wellbeing: false },
});

const initial: State = {
  role: 'student',
  studentId: 's1',
  onboarded: { s1: false, s2: true },
  applied: [],
  savedPrograms: [],
  dismissedPrograms: [],
  extraExperiences: [],
  extraCheckins: [],
  extraOpportunities: [],
  portfolioOrder: ['e9', 'e7', 'e5', 'e8'],
  sharing: { s1: defaultSharing(), s2: { ...defaultSharing(), university: { journey: true, skills: true, reflections: false, wellbeing: false } } },
};

const KEY = 'mcp-demo-v1';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return initial;
}

const Ctx = createContext<{ s: State; set: (fn: (s: State) => State) => void; reset: () => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s]);
  return <Ctx.Provider value={{ s, set: setS, reset: () => setS(initial) }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  const { s, set } = c;
  const student = students.find((x) => x.id === s.studentId)!;
  return {
    ...c,
    student,
    opportunities: [...baseOpportunities, ...s.extraOpportunities],
    experiences: [...baseExperiences, ...s.extraExperiences].filter((e) => e.studentId === s.studentId).sort((a, b) => b.date.localeCompare(a.date)),
    checkins: [...baseWellbeing, ...s.extraCheckins].filter((w) => w.studentId === s.studentId),
    sharing: s.sharing[s.studentId],
    update: set,
  };
}
