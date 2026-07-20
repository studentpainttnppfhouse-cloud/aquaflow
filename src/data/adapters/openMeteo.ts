import type { RainHour, RainState, Station } from '../types'
import { clamp, fetchJson, hash01 } from '../../lib/util'
import fallback from '../fallback/openMeteo.json'

// Open-Meteo forecast API — keyless, CORS-open, no rate-limit issues at demo scale.
// Docs: https://open-meteo.com/en/docs
// Single-point (city) URL:
//   https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.52&hourly=precipitation,rain,precipitation_probability&forecast_days=2&timezone=Asia/Bangkok
// The API also accepts comma-separated coordinate lists and returns an array,
// which lets us fetch a real per-station forecast in one request.

interface OpenMeteoResponse {
  latitude: number
  longitude: number
  hourly: {
    time: string[]
    precipitation: number[]
    rain?: number[]
    precipitation_probability: number[]
  }
}

const HOURLY = 'precipitation,rain,precipitation_probability'
const BASE = 'https://api.open-meteo.com/v1/forecast'

function toHours(r: OpenMeteoResponse): RainHour[] {
  return r.hourly.time.map((time, i) => ({
    time,
    precipitation: r.hourly.precipitation[i] ?? 0,
    probability: r.hourly.precipitation_probability[i] ?? 0,
  }))
}

/** Sum of forecast rain (mm) over the next 3 hours, starting from the current hour. */
export function next3hMm(hours: RainHour[], now = new Date()): number {
  const idx = hours.findIndex((h) => new Date(h.time).getTime() >= now.getTime() - 3600e3)
  const from = idx < 0 ? 0 : idx
  return +hours
    .slice(from, from + 3)
    .reduce((s, h) => s + h.precipitation, 0)
    .toFixed(1)
}

export async function fetchRain(stations: Station[]): Promise<RainState> {
  try {
    const lats = [13.75, ...stations.map((s) => s.lat)].map((v) => v.toFixed(3)).join(',')
    const lngs = [100.52, ...stations.map((s) => s.lng)].map((v) => v.toFixed(3)).join(',')
    const url = `${BASE}?latitude=${lats}&longitude=${lngs}&hourly=${HOURLY}&forecast_days=2&timezone=Asia%2FBangkok`
    const res = await fetchJson<OpenMeteoResponse | OpenMeteoResponse[]>(url)
    const arr = Array.isArray(res) ? res : [res]
    const cityHours = toHours(arr[0])
    const perStation: Record<string, number> = {}
    stations.forEach((s, i) => {
      const r = arr[i + 1] ?? arr[0]
      perStation[s.id] = next3hMm(toHours(r))
    })
    return { hours: cityHours, perStation, feed: 'live' }
  } catch {
    // Committed snapshot — single city point; give each station a stable
    // per-location variation so the coordination logic still has contrast.
    const hours = toHours(fallback as unknown as OpenMeteoResponse)
    const base = next3hMm(shiftSnapshotToNow(hours))
    const perStation: Record<string, number> = {}
    for (const s of stations) {
      perStation[s.id] = +clamp(base * (0.7 + hash01(s.id) * 0.7), 0, 60).toFixed(1)
    }
    return { hours: shiftSnapshotToNow(hours), perStation, feed: 'cached' }
  }
}

/** The committed snapshot has fixed dates; re-stamp its 48 h onto today so time-of-day patterns (afternoon storms) still line up with the live clock. */
function shiftSnapshotToNow(hours: RainHour[]): RainHour[] {
  const today = new Date()
  today.setMinutes(0, 0, 0)
  const startHour = hours.findIndex((h) => new Date(h.time).getHours() === today.getHours())
  const rotated = startHour <= 0 ? hours : [...hours.slice(startHour), ...hours.slice(0, startHour)]
  return rotated.map((h, i) => {
    const t = new Date(today.getTime() + i * 3600e3)
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      ...h,
      time: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:00`,
    }
  })
}
