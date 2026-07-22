import type { Channel, Recipient, Role, Zone } from './types'
import { hash01 } from '../lib/util'

// ─── Synthetic recipient registry ────────────────────────────────────────────
// HONESTY NOTE: every name and phone number here is fabricated deterministically
// from the district name — there is NO real personal data in this demo. In a
// production system this registry is where อบต. / เขต contact rolls (grouped by
// role) and telecom cell-area mappings would live. The small visible sample per
// district stands in for the full subscriber list; `population` scales the
// "reach" estimate a real fan-out would hit.

const FIRST = ['สมชาย', 'สมหญิง', 'ประเสริฐ', 'มาลี', 'วิเชียร', 'อนงค์', 'ธนา', 'กมล', 'ศิริพร', 'ณรงค์', 'พิมพา', 'สุชาติ']
const LAST = ['ใจดี', 'รักษ์น้ำ', 'บุญมี', 'ทองสุข', 'แสนสุข', 'พงษ์ไทย', 'ศรีสมุทร', 'คงคา']

/** Deterministic synthetic Thai mobile number: 0X-XXXX-XXXX. */
function phone(seed: string): string {
  const prefix = ['08', '09', '06'][Math.floor(hash01(seed + '#p') * 3)]
  const mid = Math.floor(hash01(seed + '#m') * 9000 + 1000)
  const tail = Math.floor(hash01(seed + '#t') * 9000 + 1000)
  const d = Math.floor(hash01(seed + '#d') * 10)
  return `${prefix}${d}-${mid}-${tail}`
}

function name(seed: string): string {
  const f = FIRST[Math.floor(hash01(seed + '#f') * FIRST.length)]
  const l = LAST[Math.floor(hash01(seed + '#l') * LAST.length)]
  return `${f} ${l}`
}

// A "smartphone" resident also has LINE; a basic feature phone gets SMS + voice
// + cell broadcast only. Leaders and officials are reachable on every channel.
const CHANNELS_BY_ROLE: Record<Role, (seed: string) => Channel[]> = {
  leader: () => ['sms', 'cell_broadcast', 'line', 'voice'],
  official: () => ['sms', 'cell_broadcast', 'line', 'voice'],
  resident: (seed) =>
    hash01(seed + '#smart') > 0.45
      ? ['sms', 'cell_broadcast', 'line', 'voice']
      : ['sms', 'cell_broadcast', 'voice'], // basic feature phone — no LINE
}

const ROLE_LABEL: Record<Role, string> = {
  leader: 'ผู้นำชุมชน',
  official: 'เจ้าหน้าที่ อบต./เขต',
  resident: 'ประชาชน',
}

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role]
}

function makeRecipient(district: string, role: Role, i: number): Recipient {
  const seed = `${district}:${role}:${i}`
  const roleName = role === 'leader' ? 'ผู้นำชุมชน' : role === 'official' ? 'จนท.' : ''
  return {
    id: seed,
    name: `${roleName ? roleName + ' ' : ''}${name(seed)}`,
    phone: phone(seed),
    role,
    district,
    channels: CHANNELS_BY_ROLE[role](seed),
  }
}

/** Build a zone (population + a representative sample of recipients) per district. */
export function buildZones(districts: string[]): Record<string, Zone> {
  const zones: Record<string, Zone> = {}
  for (const district of districts) {
    const population = Math.round(8000 + hash01(district + '#pop') * 62000)
    const recipients: Recipient[] = [
      makeRecipient(district, 'leader', 0),
      makeRecipient(district, 'official', 0),
      makeRecipient(district, 'official', 1),
      makeRecipient(district, 'resident', 0),
      makeRecipient(district, 'resident', 1),
      makeRecipient(district, 'resident', 2),
      makeRecipient(district, 'resident', 3),
    ]
    zones[district] = { district, population, recipients }
  }
  return zones
}

/** Rough count of addressable phone numbers in a zone (~1.1 lines per person, 85% reachable). */
export function zoneReach(zone: Zone): number {
  return Math.round(zone.population * 1.1 * 0.85)
}
