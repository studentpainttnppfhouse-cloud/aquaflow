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
        if (c.kind === 'river') {
          // Chao Phraya — glowing main discharge line the whole network drains into.
          return (
            <Polyline
              key={`${c.id}-river`}
              positions={c.path}
              className="river-glow"
              pathOptions={{ color: '#2DE0C8', weight: 6, opacity: 0.5 }}
            >
              <Popup>
                <b>{c.name}</b>
                <div className="text-xs opacity-80">
                  แม่น้ำสายหลัก · น้ำจากทุกเขตไหลลงสู่จุดนี้ก่อนออกอ่าวไทย
                  {c.approx && ' · แนวเส้นโดยประมาณ'}
                </div>
              </Popup>
            </Polyline>
          )
        }
        const flowing = flowingCanals.has(c.id)
        return (
          <Polyline
            key={`${c.id}-${flowing ? 'flow' : 'idle'}`}
            positions={c.path}
            className={flowing ? 'canal-flowing' : undefined}
            pathOptions={{
              color: flowing ? '#2DE0C8' : '#254564',
              weight: 3,
              opacity: flowing ? 0.95 : 0.55,
            }}
          >
            <Popup>
              <b>{c.name}</b>
              <div className="text-xs opacity-80">
                คลองระบายน้ำหลัก{c.approx && ' · แนวเส้นโดยประมาณ'}
              </div>
            </Popup>
          </Polyline>
        )
      })}
      {/* animated flow overlay riding the glowing river line */}
      {canals
        .filter((c) => c.kind === 'river')
        .map((c) => (
          <Polyline
            key={`${c.id}-flow`}
            positions={c.path}
            className="river-flow"
            interactive={false}
            pathOptions={{ color: '#8ff5e6', weight: 2.5, opacity: 0.9 }}
          />
        ))}

      {stations.map((s) => (
        <Marker
          key={`${s.id}-${s.status}`}
          position={[s.lat, s.lng]}
          icon={stationIcon(s)}
          eventHandlers={{ click: () => selectStation(s.id) }}
        />
      ))}
    </MapContainer>
  )
}
