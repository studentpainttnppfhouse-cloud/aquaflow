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
}

export interface Canal {
  id: string
  name: string
  kind: 'canal' | 'river'
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

/** Whether an area's plan is being run automatically. */
export type Activation = 'idle' | 'pending' | 'active'

/** Aggregated state for one district ("area"), recomputed each simulation tick. */
export interface AreaState {
  district: string
  stationIds: string[]
  count: number
  avgLevel: number
  maxLevel: number
  atRisk: number
  pumping: number
  /** 0–100 composite flood risk for the area. */
  risk: number
  /** How many stations the current plan would act on right now. */
  actionable: number
  /** Projected worst-case level in ~3 h from the rain forecast. */
  projected: number
  activation: Activation
}

export type NotiKind = 'approval' | 'flood' | 'info' | 'success'

/** Side-rail notification — an approval request, a flood-soon warning, or a system note. */
export interface Notification {
  id: string
  kind: NotiKind
  title: string
  body: string
  time: string
  district?: string
  /** Stations the pre-contemplated plan will act on if approved. */
  stationIds?: string[]
  /** Estimated city-risk reduction (pp) if this plan runs. */
  riskReduction?: number
}

/** Per-station answer to "is it OK to discharge more water downstream right now?" */
export interface DischargeVerdict {
  ok: boolean
  /** 0–100 remaining capacity of the downstream node/river to accept water. */
  headroom: number
  reason: string
  tone: 'green' | 'amber' | 'coral'
}

// ─── Multi-channel alerting ──────────────────────────────────────────────────
// The "reach every phone" layer: one broadcast fans out to SMS, cell broadcast,
// LINE and an automated voice call so an alert lands on a basic feature phone
// with no app and weak internet, not only on a smartphone.

/** Escalation ladder attached to every prediction and every broadcast. */
export type Severity = 'normal' | 'watch' | 'warning' | 'emergency'

/** Delivery channels a broadcast can fan out to. */
export type Channel = 'sms' | 'cell_broadcast' | 'line' | 'voice'

/** Who a recipient is — drives which channels they get and escalation order. */
export type Role = 'resident' | 'leader' | 'official'

export interface Recipient {
  id: string
  name: string
  /** Thai mobile number, format 0X-XXXX-XXXX (synthetic — never a real subscriber). */
  phone: string
  role: Role
  district: string
  /** Channels this handset/person can actually receive — a basic phone has no LINE. */
  channels: Channel[]
}

/** One district's addressable population for the broadcast reach estimate. */
export interface Zone {
  district: string
  population: number
  recipients: Recipient[]
}

export type DeliveryStatus = 'queued' | 'sending' | 'sent' | 'failed'

export interface DeliveryReceipt {
  recipientId: string
  recipientName: string
  role: Role
  channel: Channel
  status: DeliveryStatus
  attempts: number
}

export interface Broadcast {
  id: string
  district: string
  severity: Severity
  message: string
  channels: Channel[]
  createdAt: number
  /** Estimated phone numbers addressed across the whole zone (population-scaled). */
  reach: number
  receipts: DeliveryReceipt[]
  /** True while the device was offline at send time — held in the retry queue. */
  queued: boolean
}
