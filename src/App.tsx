import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import ViewSwitcher from './components/ViewSwitcher'
import Landing from './views/Landing'
import Guide from './views/Guide'
import ControlCenter from './views/control/ControlCenter'
import CitizenApp from './views/citizen/CitizenApp'

export default function App() {
  const view = useAppStore((s) => s.view)
  const ready = useAppStore((s) => s.ready)
  const init = useAppStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <div className="h-full">
      <ViewSwitcher />
      {view === 'landing' && <Landing />}
      {view === 'guide-control' && <Guide audience="control" />}
      {view === 'guide-citizen' && <Guide audience="citizen" />}
      {view === 'control' && (ready ? <ControlCenter /> : <Booting />)}
      {view === 'citizen' && (ready ? <CitizenApp /> : <Booting />)}
    </div>
  )
}

function Booting() {
  return (
    <div className="grid h-full place-items-center bg-gradient-to-b from-hud-bg to-hud-bg2 text-hud-dim">
      <div className="text-center">
        <div className="animate-pulse text-3xl">🌊</div>
        <p className="label-tech mt-3">กำลังเชื่อมต่อแหล่งข้อมูล…</p>
      </div>
    </div>
  )
}
