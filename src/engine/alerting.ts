import type {
  Broadcast,
  Channel,
  DeliveryReceipt,
  Recipient,
  Severity,
  TideState,
} from '../data/types'
import { uid } from '../lib/util'

// ─── AquaFlow multi-channel alerting layer ───────────────────────────────────
// The headline feature: a single `sendAlert()` reaches EVERY phone in a zone —
// not just smartphones — by fanning out over SMS, cell broadcast, LINE and an
// automated voice call. Rural / low-signal areas and elderly residents without
// an app are the whole point, so the default channel set always includes SMS +
// voice, and warnings escalate to nationwide cell broadcast.
//
// HONESTY NOTE: nothing here actually contacts a carrier — this is a SIMULATED
// fan-out, labeled "จำลอง" in the UI, exactly like the rest of the demo. Each
// provider below is written behind a single `ChannelProvider` interface so a
// real gateway (Twilio / ThaiBulkSMS / AIS / TrueMove for SMS · DDPM cell
// broadcast · LINE Messaging API · a voice/IVR provider) can drop in unchanged.

// ── Channel metadata ─────────────────────────────────────────────────────────

export const CHANNEL_META: Record<Channel, { label: string; icon: string; blurb: string }> = {
  sms: { label: 'SMS', icon: '📩', blurb: 'ถึงทุกเครื่อง รวมมือถือปุ่มกด' },
  cell_broadcast: { label: 'Cell Broadcast', icon: '📡', blurb: 'เตือนภัยฉุกเฉินทั้งเสาสัญญาณ (ปภ.)' },
  line: { label: 'LINE', icon: '💬', blurb: 'ผู้ใช้สมาร์ทโฟน' },
  voice: { label: 'สายด่วนเสียง (IVR)', icon: '📞', blurb: 'อ่านเตือนภัยเป็นเสียงไทย' },
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; th: string; icon: string; rank: number; channels: Channel[] }
> = {
  normal: { label: 'Normal', th: 'ปกติ', icon: '🟢', rank: 0, channels: [] },
  watch: { label: 'Watch', th: 'เฝ้าระวัง', icon: '🟡', rank: 1, channels: ['sms', 'line'] },
  warning: { label: 'Warning', th: 'เตือนภัย', icon: '🟠', rank: 2, channels: ['sms', 'line', 'cell_broadcast', 'voice'] },
  emergency: { label: 'Emergency', th: 'ฉุกเฉิน', icon: '🔴', rank: 3, channels: ['sms', 'line', 'cell_broadcast', 'voice'] },
}

/** Map a 0–100 risk score onto the escalation ladder. */
export function severityFromRisk(risk: number): Severity {
  if (risk >= 80) return 'emergency'
  if (risk >= 60) return 'warning'
  if (risk >= 40) return 'watch'
  return 'normal'
}

// ── Message drafting ─────────────────────────────────────────────────────────
// Thai SMS is NOT GSM-7 — it encodes as UCS-2 at 70 chars per single part
// (67 per concatenated part). We keep messages plain (no emoji dependence) so
// they render on a basic feature phone, and report the true segment count.

const UCS2_SINGLE = 70
const UCS2_CONCAT = 67

export function smsSegments(message: string): number {
  const len = [...message].length // code points, not UTF-16 units
  if (len <= UCS2_SINGLE) return 1
  return Math.ceil(len / UCS2_CONCAT)
}

export interface DraftContext {
  district: string
  tide?: TideState
  draining?: boolean
}

/** Auto-draft a plain-Thai alert for a severity + district, ready to broadcast. */
export function draftMessage(severity: Severity, ctx: DraftContext): string {
  const d = `เขต${ctx.district}`
  const tideTxt =
    ctx.tide && ctx.tide.phase === 'rising'
      ? ' น้ำทะเลขึ้น ระบายช้า'
      : ctx.tide && ctx.tide.phase === 'falling'
        ? ' น้ำทะเลลง เร่งระบายได้'
        : ''
  const drainTxt = ctx.draining ? ' ศูนย์ควบคุมกำลังเร่งสูบน้ำ' : ''
  switch (severity) {
    case 'emergency':
      return `[AquaFlow ฉุกเฉิน] ${d} เสี่ยงน้ำท่วมสูงมาก ยกของขึ้นที่สูงและเตรียมย้ายผู้สูงอายุ/ผู้ป่วยทันที ปิดปลั๊กไฟชั้นล่าง.${drainTxt} โทร 199/1555`
    case 'warning':
      return `[AquaFlow เตือนภัย] ${d} ระดับน้ำสูงขึ้นเร็ว เตรียมยกของและติดตามประกาศใกล้ชิด.${tideTxt}${drainTxt} สอบถาม 1555`
    case 'watch':
      return `[AquaFlow เฝ้าระวัง] ${d} ระดับน้ำในคลองสูงกว่าปกติ โปรดติดตามสถานการณ์และเก็บทางระบายน้ำหน้าบ้านให้โล่ง.${tideTxt}`
    default:
      return `[AquaFlow] ${d} สถานการณ์น้ำปกติ ไม่มีการแจ้งเตือนในขณะนี้`
  }
}

// ── Provider abstraction ─────────────────────────────────────────────────────

export interface ChannelProvider {
  channel: Channel
  /**
   * Deliver to one recipient. Real impl POSTs to the gateway and returns its ack;
   * this simulation resolves after a short latency with an occasional failure so
   * the retry path is exercised on screen.
   */
  send(recipient: Recipient, message: string, severity: Severity): Promise<boolean>
}

const rand = () => Math.random()
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Factory for a simulated provider with a given per-channel latency + failure rate. */
function simulated(channel: Channel, latency: [number, number], failRate: number): ChannelProvider {
  return {
    channel,
    async send() {
      // --- REAL GATEWAY GOES HERE ---------------------------------------------
      // sms:            await twilio.messages.create({ to, body })  // or ThaiBulkSMS / AIS / TrueMove
      // cell_broadcast: hand off to Thailand's DDPM (ปภ.) Cell Broadcast Entity — CBC/CBE integration
      // line:           await lineClient.pushMessage(userId, { type: 'text', text })  // LINE Messaging API
      // voice:          place an automated TTS call via an IVR provider (e.g. Twilio Voice + <Say language="th-TH">)
      // ------------------------------------------------------------------------
      await wait(latency[0] + rand() * (latency[1] - latency[0]))
      return rand() > failRate
    },
  }
}

/** Provider registry — swap any entry for a real gateway-backed implementation. */
export const PROVIDERS: Record<Channel, ChannelProvider> = {
  sms: simulated('sms', [120, 400], 0.08),
  cell_broadcast: simulated('cell_broadcast', [60, 180], 0.02), // broadcast — very reliable, near-instant
  line: simulated('line', [100, 300], 0.05),
  voice: simulated('voice', [300, 700], 0.12), // calls fail more (no answer / busy)
}

const MAX_ATTEMPTS = 3

export interface SendAlertOptions {
  district: string
  severity: Severity
  message: string
  recipients: Recipient[]
  reach: number
  /** Override the severity's default channel set (e.g. operator unticked LINE). */
  channels?: Channel[]
  /** Called on every receipt state change so the UI can animate delivery + retries. */
  onUpdate?: (broadcast: Broadcast) => void
  /** When true the message is only queued (device offline) — no provider is hit. */
  queuedOffline?: boolean
}

/**
 * Fan a single alert out to every registered recipient over every channel they
 * can receive, retrying failures up to MAX_ATTEMPTS. Returns the final broadcast
 * with a per-recipient-per-channel delivery ledger. Never fails silently: a
 * receipt that exhausts its retries ends as `failed`, visible in the ledger.
 */
export async function sendAlert(opts: SendAlertOptions): Promise<Broadcast> {
  const { district, severity, message, recipients, reach, onUpdate, queuedOffline } = opts
  const allowed = opts.channels ?? SEVERITY_META[severity].channels

  const receipts: DeliveryReceipt[] = []
  for (const r of recipients) {
    for (const channel of r.channels) {
      if (!allowed.includes(channel)) continue
      receipts.push({
        recipientId: r.id,
        recipientName: r.name,
        role: r.role,
        channel,
        status: 'queued',
        attempts: 0,
      })
    }
  }

  const broadcast: Broadcast = {
    id: uid('bcast'),
    district,
    severity,
    message,
    channels: allowed,
    createdAt: Date.now(),
    reach,
    receipts,
    queued: !!queuedOffline,
  }

  // Offline: hold everything in the queue, hand back untouched for the store to flush later.
  if (queuedOffline) {
    onUpdate?.(broadcast)
    return broadcast
  }

  const byId = new Map(recipients.map((r) => [r.id, r]))
  const emit = () => onUpdate?.({ ...broadcast, receipts: [...broadcast.receipts] })

  await Promise.all(
    receipts.map(async (receipt) => {
      const recipient = byId.get(receipt.recipientId)!
      const provider = PROVIDERS[receipt.channel]
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        receipt.status = 'sending'
        receipt.attempts = attempt
        emit()
        const ok = await provider.send(recipient, message, severity)
        if (ok) {
          receipt.status = 'sent'
          emit()
          return
        }
        if (attempt < MAX_ATTEMPTS) await wait(250 * attempt) // backoff before retry
      }
      receipt.status = 'failed'
      emit()
    }),
  )

  return { ...broadcast, receipts: [...broadcast.receipts] }
}

// ── Aggregate helpers for the UI ─────────────────────────────────────────────

export function channelCounts(b: Broadcast): Record<Channel, { sent: number; total: number; failed: number }> {
  const out = {} as Record<Channel, { sent: number; total: number; failed: number }>
  for (const ch of b.channels) out[ch] = { sent: 0, total: 0, failed: 0 }
  for (const r of b.receipts) {
    const c = out[r.channel]
    if (!c) continue
    c.total++
    if (r.status === 'sent') c.sent++
    if (r.status === 'failed') c.failed++
  }
  return out
}

export function deliveryProgress(b: Broadcast): { done: number; total: number; failed: number } {
  let done = 0
  let failed = 0
  for (const r of b.receipts) {
    if (r.status === 'sent' || r.status === 'failed') done++
    if (r.status === 'failed') failed++
  }
  return { done, total: b.receipts.length, failed }
}
