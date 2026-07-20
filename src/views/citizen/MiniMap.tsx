import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { districtCenter, useAppStore } from '../../store/useAppStore'

// CARTO light basemap for the citizen look.
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export default function MiniMap() {
  const district = useAppStore((s) => s.district)
  const stations = useAppStore((s) => s.stations)
  const canals = useAppStore((s) => s.canals)
  const center = useAppStore((s) => districtCenter(s, district))
  const local = stations.filter((s) => s.district === district)

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="px-3 pt-2 text-sm font-bold text-slate-900">🗺️ แผนที่ย่านของคุณ</div>
      <div className="citizen-map mt-1 h-44">
        <MapContainer
          key={district}
          center={center}
          zoom={13}
          className="h-full w-full"
          dragging={true}
          scrollWheelZoom={false}
          attributionControl={true}
        >
          <TileLayer url={LIGHT_TILES} attribution={ATTRIBUTION} subdomains="abcd" maxZoom={19} />
          {canals.map((c) => (
            <Polyline
              key={c.id}
              positions={c.path}
              pathOptions={{ color: c.kind === 'river' ? '#60a5fa' : '#7dd3fc', weight: c.kind === 'river' ? 4 : 2.5, opacity: 0.7 }}
            />
          ))}
          {local.map((s) => (
            <Marker
              key={`${s.id}-${s.status}`}
              position={[s.lat, s.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div class="stn-marker stn-${s.status}" style="width:20px;height:20px;font-size:10px">${s.type === 'pump' ? 'ส' : s.type === 'floodgate' ? 'ป' : 'อ'}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <b>{s.name}</b>
                <div className="text-xs">
                  ระดับน้ำ {s.level.toFixed(0)}%{s.pumping ? ' · 💧 กำลังระบาย' : ''}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
