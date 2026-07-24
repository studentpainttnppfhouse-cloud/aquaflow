export type StationType = 'pump' | 'floodgate' | 'tunnel'
export type StationStatus = 'ok' | 'watch' | 'risk' | 'pumping'
export type DataFeed = 'live' | 'cached' | 'modeled'

export interface Station {
  id: string
  name: string
  type: StationType
  canal: string
  canalId: string | null
  district: string
  lat: number
  lng: number
  capacity_cms: number
  /** Shared discharge node — the coordination rule staggers stations that drain to the same node. */
  downstream: string
  /**
   * Depth of the canal/sump bed below the bank at this point (metres). The
   * distance a laser/ultrasonic level sensor mounted at the bank reads down to
   * an empty bed. Used to turn a % level into a real water-column depth and a
   * metres-of-freeboard figure the AI planner ingests.
   */
  bedDepth_m: number
  approx?: boolean
}

export interface StationState extends Station {
  /** Displayed water level, % of design capacity (eased each frame). */
  level: number
  /** Simulation target the displayed level eases toward. */
  targetLevel: number
  /** Positive = filling, negative = draining (%/min, derived). */
  trend: number
  pumping: boolean
  status: StationStatus
  /** Forecast rain at this location over the next 3 h (mm). */
  rain3h: number
  /** Laser/ultrasonic reading: current water-column depth at the sensor (m). */
  laserDepth_m: number
  /** Metres of headroom left before water reaches the bank (bedDepth − laserDepth). */
  freeboard_m: number
  /** METAR-style coded condition string fed to the AI planner. */
  metar: string
}

export interface Canal {
  id: string
  name: string
  kind: 'canal' | 'river'
  /** Nominal channel depth (m) — laser reference datum for stations on this canal. */
  depth_m: number
  approx: boolean
  path: [number, number][]
}

export interface TidePoint {
  /** epoch ms */
  t: number
  /** metres above datum */
  h: number
}

export interface TideState {
  height: number
  phase: 'rising' | 'falling'
  source: DataFeed
  series: TidePoint[]
  range: [number, number]
}

export interface RainHour {
  time: string
  precipitation: number
  probability: number
}

export interface RainState {
  hours: RainHour[]
  /** next-3h rain (mm) per station id */
  perStation: Record<string, number>
  feed: DataFeed
}

export interface Gauge {
  id: string
  name: string
  canal: string
  waterlevel_m: number
  bank_m: number
  district: string
}

export type RecAction = 'pump' | 'open_gate' | 'wait'

export interface Recommendation {
  id: string
  stationId: string
  stationName: string
  action: RecAction
  reason: string
  /** Estimated city-risk reduction in percentage points. */
  riskReduction: number
  score: number
}

export interface LogEntry {
  id: string
  time: string
  text: string
  kind: 'action' | 'system' | 'alert'
}
