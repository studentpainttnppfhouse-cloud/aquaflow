import type { DataFeed, Gauge } from '../types'
import { fetchJson } from '../../lib/util'
import fallbackJson from '../fallback/waterLevels.json'

// ThaiWater / HII (สถาบันสารสนเทศทรัพยากรน้ำ, สสน.) — https://www.thaiwater.net
// The portal is backed by a public JSON API; the endpoint below serves the
// nationwide canal/river water-level board the site itself renders. It needs no
// key but is not guaranteed to send CORS headers, so the adapter treats it as
// best-effort and falls back to the committed snapshot (badge shows "cached").
const THAIWATER_URL =
  'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load'

interface ThaiWaterRow {
  station?: {
    id?: number
    tele_station_name?: { th?: string }
    canal_name?: string
  }
  geocode?: { province_name?: { th?: string }; amphoe_name?: { th?: string } }
  waterlevel_msl?: number | string | null
  min_bank?: number | null
}

interface ThaiWaterResponse {
  waterlevel_data?: { data?: ThaiWaterRow[] }
  data?: ThaiWaterRow[]
}

export interface WaterLevelsResult {
  levels: Record<string, number>
  gauges: Gauge[]
  feed: DataFeed
}

export async function fetchWaterLevels(): Promise<WaterLevelsResult> {
  const fallback = fallbackJson as unknown as { levels: Record<string, number>; gauges: Gauge[] }
  try {
    const res = await fetchJson<ThaiWaterResponse>(THAIWATER_URL, 7000)
    const rows = res.waterlevel_data?.data ?? res.data ?? []
    const bkk = rows.filter((r) => r.geocode?.province_name?.th === 'กรุงเทพมหานคร')
    const gauges: Gauge[] = bkk
      .map((r): Gauge | null => {
        const level = Number(r.waterlevel_msl)
        if (!Number.isFinite(level) || !r.station?.tele_station_name?.th) return null
        return {
          id: String(r.station.id ?? r.station.tele_station_name.th),
          name: r.station.tele_station_name.th,
          canal: r.station.canal_name ?? 'ไม่ระบุ',
          waterlevel_m: level,
          bank_m: r.min_bank ?? level + 1,
          district: r.geocode?.amphoe_name?.th ?? '-',
        }
      })
      .filter((g): g is Gauge => g !== null)
      .slice(0, 12)
    if (gauges.length >= 3) {
      // Real gauge readings drive the citizen canal list; per-station pump
      // levels remain simulated (no public per-pump telemetry exists).
      return { levels: fallback.levels, gauges, feed: 'live' }
    }
    throw new Error('too few Bangkok gauges in response')
  } catch {
    return { levels: fallback.levels, gauges: fallback.gauges, feed: 'cached' }
  }
}
