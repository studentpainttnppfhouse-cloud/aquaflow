import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, BookOpen, Compass, FileText, GraduationCap, HeartPulse, Home, Info, Lock, Palette as PaletteIcon,
  RotateCcw, Users, ClipboardList, MessageSquareHeart, Baby,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { students, gradeLabel } from '../data/mock';
import type { Role } from '../types';

const roleLabel: Record<Role, string> = { student: 'นักเรียน', mentor: 'พี่เลี้ยง (Mentor)', teacher: 'ครู / ผู้ประสานงาน', parent: 'ผู้ปกครอง', judge: 'กรรมการ (Impact)' };
const roleHome: Record<Role, string> = { student: '/', mentor: '/mentor', teacher: '/teacher/cohort', parent: '/parent', judge: '/impact' };

type Item = { to: string; label: string; short?: string; icon: typeof Home; g12?: boolean };
const nav: Record<Role, Item[]> = {
  student: [
    { to: '/', label: 'เส้นทางของฉัน', short: 'หน้าหลัก', icon: Home },
    { to: '/explore', label: 'สำรวจโอกาส', short: 'สำรวจ', icon: Compass },
    { to: '/log', label: 'บันทึกประสบการณ์', short: 'บันทึก', icon: BookOpen },
    { to: '/profile', label: 'Skill Profile', short: 'สีของฉัน', icon: PaletteIcon },
    { to: '/wellbeing', label: 'ใจฉันวันนี้', short: 'ใจฉัน', icon: HeartPulse },
    { to: '/portfolio', label: 'Portfolio', icon: FileText, g12: true },
    { to: '/programs', label: 'สาขาที่อาจเหมาะ', icon: GraduationCap, g12: true },
    { to: '/privacy', label: 'ความเป็นส่วนตัว', icon: Lock },
  ],
  mentor: [{ to: '/mentor', label: 'น้อง ๆ ของฉัน', icon: MessageSquareHeart }],
  teacher: [
    { to: '/teacher/cohort', label: 'ภาพรวมรุ่น', icon: Users },
    { to: '/teacher/placements', label: 'จัดการกิจกรรม', icon: ClipboardList },
  ],
  parent: [{ to: '/parent', label: 'ภาพรวมลูก', icon: Baby }],
  judge: [
    { to: '/impact', label: 'Pilot Impact', icon: BarChart3 },
    { to: '/about', label: 'เกี่ยวกับโครงการ', icon: Info },
  ],
};

export default function Layout() {
  const { s, update, student, reset } = useStore();
  const navigate = useNavigate();
  const items = nav[s.role].filter((i) => !i.g12 || student.grade === 12);
  const mobileItems = s.role === 'student' ? items.slice(0, 5) : items;

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-navy/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <NavLink to={roleHome[s.role]} className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 grid-cols-2 overflow-hidden rounded-lg" aria-hidden>
              <span className="bg-orange" /><span className="bg-amber" /><span className="bg-sky" /><span className="bg-leaf" />
            </span>
            <span>My Color Pathway</span>
          </NavLink>
          <span className="chip bg-amber/30 text-xs text-navy">Prototype · ข้อมูลจำลอง</span>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              <span className="sr-only sm:not-sr-only">มุมมอง</span>
              <select className="rounded-lg border border-navy/15 bg-white px-2 py-1" value={s.role}
                onChange={(e) => { const r = e.target.value as Role; update((x) => ({ ...x, role: r })); navigate(roleHome[r]); }}>
                {(Object.keys(roleLabel) as Role[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
            </label>
            {(s.role === 'student' || s.role === 'parent') && (
              <label className="flex items-center gap-1">
                <span className="sr-only">นักเรียน</span>
                <select className="rounded-lg border border-navy/15 bg-white px-2 py-1" value={s.studentId}
                  onChange={(e) => { const id = e.target.value; update((x) => ({ ...x, studentId: id })); navigate(s.role === 'student' ? (s.onboarded[id] ? '/' : '/onboarding') : '/parent'); }}>
                  {students.map((st) => <option key={st.id} value={st.id}>น้อง{st.nickname} ({gradeLabel(st.grade)})</option>)}
                </select>
              </label>
            )}
            <button className="rounded-lg p-1.5 hover:bg-navy/5" title="รีเซ็ตเดโม" aria-label="รีเซ็ตข้อมูลเดโม" onClick={() => { reset(); navigate('/onboarding'); }}>
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav className="sticky top-20 hidden h-fit w-56 shrink-0 space-y-1 lg:block" aria-label="เมนูหลัก">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 font-medium ${isActive ? 'bg-navy text-cream' : 'hover:bg-navy/5'}`}>
              <i.icon className="h-5 w-5" aria-hidden />{i.label}
            </NavLink>
          ))}
          {s.role !== 'judge' && (
            <NavLink to="/about" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink hover:bg-navy/5">
              <Info className="h-4 w-4" aria-hidden />เกี่ยวกับโครงการ
            </NavLink>
          )}
        </nav>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white lg:hidden" aria-label="เมนูหลัก">
        <div className="mx-auto flex max-w-lg">
          {mobileItems.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}
              className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'font-bold text-orange' : 'text-ink'}`}>
              <i.icon className="h-5 w-5" aria-hidden /><span className="max-w-full truncate px-1">{i.short ?? i.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
