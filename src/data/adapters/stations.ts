import type { Canal, DataFeed, Station } from '../types'
import { fetchJson } from '../../lib/util'
import stationsJson from '../fallback/stations.json'
import canalsJson from '../fallback/canals.json'

// Official geometry lives on Bangkok Open Data (data.bangkok.go.th, CKAN) —
// สำนักการระบายน้ำ publishes "สถานีสูบน้ำ" / "ประตูระบายน้ำ" datasets. The portal's
// CORS policy varies by resource, so this adapter is best-effort: it searches
// CKAN for a pump-station dataset, tries its first JSON/GeoJSON resource, and
// merges any features it can verify onto the committed seed (matching by name,
// replacing approximate coordinates with official ones). Any failure → seed.
const CKAN_SEARCH =
  'https://data.bangkok.go.th/api/3/action/package_search?q=%E0%B8%AA%E0%B8%96%E0%B8%B2%E0%B8%99%E0%B8%B5%E0%B8%AA%E0%B8%B9%E0%B8%9A%E0%B8%99%E0%B9%89%E0%B8%B3&rows=3'

interface CkanResource { format?: string; url?: string }
interface CkanSearch {
  result?: { results?: { resources?: CkanResource[] }[] }
}
interface GeoFeature {
  properties?: Record<string, unknown>
  geometry?: { type?: string; coordinates?: [number, number] }
}
interface GeoJson { features?: GeoFeature[] }

export interface StationsResult {
  stations: Station[]
  canals: Canal[]
  feed: DataFeed
}

function seed(): { stations: Station[]; canals: Canal[] } {
  return {
    stations: (stationsJson as unknown as { stations: Station[] }).stations,
    canals: (canalsJson as unknown as { canals: Canal[] }).canals,
  }
}

export async function fetchStations(): Promise<StationsResult> {
  const { stations, canals } = seed()
  try {
    const search = await fetchJson<CkanSearch>(CKAN_SEARCH, 7000)
    const resources = search.result?.results?.flatMap((r) => r.resources ?? []) ?? []
    const geo = resources.find((r) => /geojson|json/i.test(r.format ?? '') && r.url)
    if (!geo?.url) throw new Error('no JSON resource in CKAN result')
    const gj = await fetchJson<GeoJson>(geo.url, 8000)
    let verified = 0
    for (const f of gj.features ?? []) {
      const coords = f.geometry?.type === 'Point' ? f.geometry.coordinates : undefined
      if (!coords) continue
      const [lng, lat] = coords
      const name = String(
        f.properties?.name ?? f.properties?.NAME ?? f.properties?.station_name ?? '',
      )
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const match = stations.find(
        (s) => name.includes(s.name.replace('สถานีสูบน้ำ', '')) || s.name.includes(name),
      )
      if (match && Math.abs(match.lat - lat) < 0.08 && Math.abs(match.lng - lng) < 0.08) {
        match.lat = lat
        match.lng = lng
        match.approx = false
        verified++
      }
    }
    if (verified > 0) return { stations, canals, feed: 'live' }
    throw new Error('no verifiable features')
  } catch {
    return { stations, canals, feed: 'cached' }
  }
}
