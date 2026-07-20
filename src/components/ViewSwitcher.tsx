import { useAppStore } from '../store/useAppStore'

/** Fixed switcher so a judge can jump between the two perspectives instantly. */
export default function ViewSwitcher() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  if (view === 'landing') return null
  const btn = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${
      active ? 'bg-hud-cyan text-slate-900' : 'text-hud-text/80 hover:bg-white/10'
    }`
  return (
    <div className="fixed right-3 top-3 z-[1200] flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/85 p-1 shadow-lg backdrop-blur">
      <button className={btn(view.includes('control'))} onClick={() => setView('control')}>
        🖥️ ศูนย์ควบคุม
      </button>
      <button className={btn(view.includes('citizen'))} onClick={() => setView('citizen')}>
        📱 ประชาชน
      </button>
      <button
        className="rounded-full px-2 py-1 text-xs text-hud-dim hover:bg-white/10"
        onClick={() => useAppStore.setState({ view: 'landing' })}
        title="กลับหน้าแรก"
      >
        ⌂
      </button>
    </div>
  )
}
