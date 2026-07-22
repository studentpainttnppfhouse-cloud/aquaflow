import { useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import type { StationState } from '../../data/types'

// CARTO dark basemap — free for non-commercial/demo use with attribution.
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const TYPE_LETTER = { pump: 'ส', floodgate: 'ป', tunnel: 'อ' } as const
const TYPE_LABEL = { pump: 'สถานีสูบน้ำ', floodgate: 'ประตูระบายน้ำ', tunnel: 'อุโมงค์ระบายน้ำ' } as const

function stationIcon(s: StationState): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="stn-marker stn-${s.status}" title="${s.name}">${TYPE_LETTER[s.type]}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

export const BANGKOK_CENTER: [number, number] = [13.765, 100.575]
export const BANGKOK_ZOOM = 11

export default function MapPanel({ mapRef }: { mapRef?: React.RefObject<L.Map> }) {
  const stations = useAppStore((s) => s.stations)
  const canals = useAppStore((s) => s.canals)
  const commandStation = useAppStore((s) => s.commandStation)
  const selectStation = useAppStore((s) => s.selectStation)

  // A canal "flows" (animated dash toward the river) while any station on it pumps.
  const flowingCanals = useMemo(
    () => new Set(stations.filter((s) => s.pumping && s.canalId).map((s) => s.canalId as string)),
    [stations],
  )

  return (
    <MapContainer
      ref={mapRef}
      center={BANGKOK_CENTER}
      zoom={BANGKOK_ZOOM}
      zoomSnap={0.5}
      className="h-full w-full"
      preferCanvas={false}
      attributionControl={true}
    >
      <TileLayer url={DARK_TILES} attribution={ATTRIBUTION} subdomains="abcd" maxZoom={19} />

      {canals.map((c) => {
        const flowing = flowingCanals.has(c.id)
        return (
          <Polyline
            key={`${c.id}-${flowing ? 'flow' : 'idle'}`}
            positions={c.path}
            className={flowing ? 'canal-flowing' : undefined}
            pathOptions={{
              color: flowing ? '#2DE0C8' : c.kind === 'river' ? '#2a4d6e' : '#254564',
              weight: c.kind === 'river' ? 5 : 3,
              opacity: flowing ? 0.95 : 0.6,
            }}
          >
            <Popup>
              <b>{c.name}</b>
              <div className="text-xs opacity-80">
                {c.kind === 'river' ? 'แม่น้ำสายหลัก (จุดรับน้ำปลายทาง)' : 'คลองระบายน้ำหลัก'}
                {c.approx && ' · แนวเส้นโดยประมาณ'}
              </div>
            </Popup>
          </Polyline>
        )
      })}

      {stations.map((s) => (
        <Marker
          key={`${s.id}-${s.status}`}
          position={[s.lat, s.lng]}
          icon={stationIcon(s)}
          eventHandlers={{ click: () => selectStation(s.id) }}
        >
          <Popup>
            <div className="min-w-[220px] font-thai">
              <div className="label-tech">
                {TYPE_LABEL[s.type]} · เขต{s.district}
              </div>
              <div className="mt-0.5 font-bold text-hud-text">{s.name}</div>
              <div className="mt-1 text-xs text-hud-text/85">
                {s.canal} · กำลังระบาย {s.capacity_cms} ลบ.ม./วินาที
                {s.approx && <span className="text-hud-dim"> · พิกัดโดยประมาณ</span>}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-hud-dim">ระดับน้ำ</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${s.level > 85 ? 'bg-hud-coral' : s.level > 65 ? 'bg-hud-amber' : s.pumping ? 'bg-hud-cyan' : 'bg-hud-green'}`}
                    style={{ width: `${Math.min(100, s.level)}%` }}
                  />
                </div>
                <b className="data-value text-hud-text">{s.level.toFixed(0)}%</b>
                <span className={s.trend > 0.5 ? 'text-hud-coral' : s.trend < -0.5 ? 'text-hud-cyan' : 'text-hud-dim'}>
                  {s.trend > 0.5 ? '▲' : s.trend < -0.5 ? '▼' : '—'}
                </span>
              </div>
              <div className="mt-1 text-xs text-hud-dim">คาดฝน 3 ชม.: {s.rain3h.toFixed(1)} มม.</div>
              <button
                onClick={() => commandStation(s.id)}
                disabled={s.pumping}
                className="mt-2.5 w-full rounded-lg bg-hud-cyan px-3 py-1.5 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
              >
                {s.pumping ? '💧 กำลังระบายน้ำ…' : s.type === 'floodgate' ? '🚪 เปิดประตูระบายน้ำ' : '💧 สั่งสูบน้ำ'}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
