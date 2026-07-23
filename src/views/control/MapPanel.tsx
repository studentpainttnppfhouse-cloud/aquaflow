import { useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import type { StationState } from '../../data/types'
import FloatingStationCard from './FloatingStationCard'

// CARTO dark basemap — free for non-commercial/demo use with attribution.
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const TYPE_LETTER = { pump: 'ส', floodgate: 'ป', tunnel: 'อ' } as const

function stationIcon(s: StationState, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="stn-marker stn-${s.status}${selected ? ' stn-selected' : ''}" title="${s.name}">${TYPE_LETTER[s.type]}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export const BANGKOK_CENTER: [number, number] = [13.755, 100.55]
export const BANGKOK_ZOOM = 11

export default function MapPanel({ mapRef }: { mapRef?: React.RefObject<L.Map> }) {
  const stations = useAppStore((s) => s.stations)
  const canals = useAppStore((s) => s.canals)
  const selectedId = useAppStore((s) => s.selectedStationId)
  const selectStation = useAppStore((s) => s.selectStation)

  // A canal "flows" (animated dash toward the river) while any station on it pumps.
  // Signature keeps this memo from thrashing every easing frame.
  const flowingSig = stations.filter((s) => s.pumping && s.canalId).map((s) => s.canalId).join(',')
  const flowingCanals = useMemo(
    () => new Set(stations.filter((s) => s.pumping && s.canalId).map((s) => s.canalId as string)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flowingSig],
  )
  // The river glows/flows whenever anything in the network is discharging.
  const networkPumping = flowingSig.length > 0 || stations.some((s) => s.pumping)

  // ── Markers: 191 stations. Rebuild only when a status changes or the selection
  //    moves — NOT every easing frame — so the map stays smooth at scale. ──────
  const statusSig = stations.map((s) => s.status[0]).join('') + '|' + selectedId
  const markers = useMemo(
    () =>
      stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={stationIcon(s, s.id === selectedId)}
          eventHandlers={{ click: () => selectStation(s.id) }}
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusSig],
  )

  const riverPumping = networkPumping

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={BANGKOK_CENTER}
        zoom={BANGKOK_ZOOM}
        zoomSnap={0.5}
        className="h-full w-full"
        preferCanvas={false}
        attributionControl
      >
        <TileLayer url={DARK_TILES} attribution={ATTRIBUTION} subdomains="abcd" maxZoom={19} />

        {canals.map((c) => {
          if (c.kind === 'river') {
            return (
              <Polyline
                key={c.id}
                positions={c.path}
                className={`river-glow ${riverPumping ? 'river-flow' : ''}`}
                pathOptions={{ color: '#38bdf8', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
              >
                <Popup>
                  <b>{c.name}</b>
                  <div className="text-xs opacity-80">แม่น้ำสายหลัก — จุดรับน้ำปลายทางของทั้งเมือง{c.approx && ' · แนวเส้นโดยประมาณ'}</div>
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
                <div className="text-xs opacity-80">คลองระบายน้ำหลัก{c.approx && ' · แนวเส้นโดยประมาณ'}</div>
              </Popup>
            </Polyline>
          )
        })}

        {markers}
      </MapContainer>

      <FloatingStationCard />
    </div>
  )
}
