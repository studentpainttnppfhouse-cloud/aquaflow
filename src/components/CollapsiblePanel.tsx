import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

const STORAGE_PREFIX = 'aquaflow.panel.'
const HEIGHT_PREFIX = 'aquaflow.panelH.'

function initialOpen(id: string, defaultOpen: boolean, mobileDefaultOpen?: boolean): boolean {
  if (typeof window === 'undefined') return defaultOpen
  const stored = window.sessionStorage.getItem(STORAGE_PREFIX + id)
  if (stored !== null) return stored === '1'
  const isMobile = window.matchMedia('(max-width: 1023px)').matches
  return isMobile && mobileDefaultOpen !== undefined ? mobileDefaultOpen : defaultOpen
}

function initialHeight(id: string): number | null {
  if (typeof window === 'undefined') return null
  const stored = window.sessionStorage.getItem(HEIGHT_PREFIX + id)
  return stored !== null ? Number(stored) : null
}

const MIN_H = 72
const MAX_H = 720
const DEFAULT_H = 190
function clampHeight(h: number): number {
  return Math.max(MIN_H, Math.min(MAX_H, h))
}

interface CollapsiblePanelProps {
  /** Stable id used as the sessionStorage key — must be unique per panel across the app. */
  id: string
  title: string
  icon?: string
  defaultOpen?: boolean
  /** Overrides defaultOpen on first load under the lg breakpoint (accordion posture). */
  mobileDefaultOpen?: boolean
  badge?: ReactNode
  /** Extra controls rendered in the header, left of the chevron. */
  actions?: ReactNode
  /** When true, this panel claims remaining flex space in its column while open (only one panel per rail should set this). */
  fill?: boolean
  /** When true, the operator can drag the bottom edge to set the panel's body height (persisted). Ignored when `fill`. */
  resizable?: boolean
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export default function CollapsiblePanel({
  id,
  title,
  icon,
  defaultOpen = true,
  mobileDefaultOpen,
  badge,
  actions,
  fill = false,
  resizable = false,
  children,
  className = '',
  bodyClassName = '',
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(() => initialOpen(id, defaultOpen, mobileDefaultOpen))
  const [height, setHeight] = useState<number | null>(() => (resizable ? initialHeight(id) ?? DEFAULT_H : null))
  const bodyRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ y: number; h: number } | null>(null)
  const panelId = useId()

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_PREFIX + id, open ? '1' : '0')
  }, [id, open])

  useEffect(() => {
    if (height != null) window.sessionStorage.setItem(HEIGHT_PREFIX + id, String(Math.round(height)))
  }, [id, height])

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startH = bodyRef.current?.getBoundingClientRect().height ?? height ?? 160
      dragStart.current = { y: e.clientY, h: startH }
      const onMove = (ev: PointerEvent) => {
        if (!dragStart.current) return
        const next = clampHeight(dragStart.current.h + (ev.clientY - dragStart.current.y))
        setHeight(next)
      }
      const onUp = () => {
        dragStart.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.userSelect = ''
      }
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [height],
  )

  const resetHeight = useCallback(() => {
    setHeight(DEFAULT_H)
    window.sessionStorage.removeItem(HEIGHT_PREFIX + id)
  }, [id])

  return (
    <div
      className={`glass-panel flex min-h-0 flex-col overflow-hidden transition-[flex-grow] duration-300 ease-out-expo ${fill ? '' : 'shrink-0'} ${className}`}
      style={fill ? { flexGrow: open ? 1 : 0, flexShrink: open ? 1 : 0, minHeight: open ? '10rem' : 0 } : undefined}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {icon && (
            <span className="shrink-0 text-sm" aria-hidden>
              {icon}
            </span>
          )}
          <span className="label-tech-lit truncate">{title}</span>
          {badge}
        </button>
        <span className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? `ยุบ ${title}` : `ขยาย ${title}`}
            className="grid h-5 w-5 shrink-0 place-items-center text-hud-dim transition hover:text-hud-text"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3.5 w-3.5 transition-transform duration-300 ease-out-expo ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 7.5l5 5 5-5" />
            </svg>
          </button>
        </span>
      </div>
      <div id={panelId} className="collapse-track min-h-0" data-open={open} style={fill ? { flex: '1 1 auto' } : undefined}>
        <div className={`collapse-inner ${fill ? 'flex min-h-0 flex-col' : ''}`}>
          <div
            ref={bodyRef}
            className={`border-t border-hud-edge p-2.5 ${
              fill
                ? 'min-h-0 flex-1 overflow-y-auto panel-scroll max-h-[75vh] lg:max-h-none'
                : resizable && height != null
                  ? 'overflow-y-auto panel-scroll'
                  : ''
            } ${bodyClassName}`}
            style={!fill && resizable && height != null ? { height } : undefined}
          >
            {children}
          </div>
          {resizable && !fill && open && (
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label={`ปรับความสูง ${title} (ดับเบิลคลิกเพื่อรีเซ็ต)`}
              onPointerDown={onResizePointerDown}
              onDoubleClick={resetHeight}
              title="ลากเพื่อปรับความสูง · ดับเบิลคลิกเพื่อรีเซ็ต"
              className="group flex h-3 cursor-ns-resize touch-none items-center justify-center border-t border-hud-edge/60 hover:bg-white/5"
            >
              <span className="h-0.5 w-8 rounded-full bg-hud-edgeStrong/70 transition group-hover:bg-hud-cyan/70" aria-hidden />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
