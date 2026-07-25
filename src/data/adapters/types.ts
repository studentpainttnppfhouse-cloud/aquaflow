// ─── Track A · LIVE — unified adapter envelope ───────────────────────────────
// Every live data source returns one shape so the app can reason about
// provenance and confidence uniformly, degrade gracefully, and NEVER let an
// international source silently drive an operational decision.

/** live = real domestic source · cache = committed snapshot · sim = computed model ·
 *  backup = an international/allowed source is standing in (labeled, non-authoritative). */
export type Provenance = 'live' | 'cache' | 'sim' | 'backup'
export type Origin = 'domestic' | 'international'

export interface Reading<T> {
  /** Scalar OR a domain payload (series / per-station map / gauge list). */
  value: T
  unit: string
  /** Config id of the source that produced this reading, e.g. 'rainfall'. */
  source: string
  /** epoch ms the value was produced. */
  fetchedAt: number
  provenance: Provenance
  origin: Origin
  /** 0..1 — how much operators should trust this reading. */
  confidence: number
  /** Hard gate: false means this reading must not drive a decision on its own. */
  usableForDecision: boolean
  /** Human-readable notes about degradation / labeling. */
  warnings: string[]
}

export interface LiveAdapter<T> {
  id: string
  fetch: () => Promise<Reading<T>>
}

export const PROVENANCE_META: Record<Provenance, { th: string; confidence: number }> = {
  live: { th: 'สด', confidence: 0.9 },
  cache: { th: 'แคช', confidence: 0.6 },
  backup: { th: 'สำรอง', confidence: 0.5 },
  sim: { th: 'จำลอง', confidence: 0.3 },
}

function makeReading<T>(
  source: string,
  origin: Origin,
  value: T,
  unit: string,
  provenance: Provenance,
  warnings: string[],
): Reading<T> {
  return {
    value,
    unit,
    source,
    fetchedAt: Date.now(),
    provenance,
    origin,
    confidence: PROVENANCE_META[provenance].confidence,
    // Only real domestic readings (live/cache) may drive a decision.
    usableForDecision: provenance === 'live' || provenance === 'cache',
    warnings,
  }
}

/** One fallback tier. Tiers are tried top-to-bottom; the first non-null value wins. */
export interface Tier<T> {
  provenance: Provenance
  origin: Origin
  run: () => Promise<T | null> | T | null
  /** Optional note appended to the reading's warnings when this tier is used. */
  note?: string
}

/**
 * Walk a source's fallback tiers (live → cache → sim, with international sources
 * pinned to 'backup') and return the first that yields a value. The last tier
 * MUST be a synchronous sim so this can never crash or return null.
 *
 * Invariant enforced here: an `international` tier can only ever be `backup`.
 */
export async function runTiers<T>(id: string, unit: string, tiers: Tier<T>[]): Promise<Reading<T>> {
  const warnings: string[] = []
  for (const tier of tiers) {
    const provenance: Provenance =
      tier.origin === 'international' && tier.provenance !== 'backup' ? 'backup' : tier.provenance
    if (tier.origin === 'international' && tier.provenance !== 'backup') {
      warnings.push(`${id}: แหล่งข้อมูลต่างประเทศถูกปรับเป็น "สำรอง" อัตโนมัติ — ห้ามใช้ตัดสินใจโดยลำพัง`)
    }
    try {
      const value = await tier.run()
      if (value != null) {
        if (tier.note) warnings.push(tier.note)
        if (provenance === 'backup') warnings.push(`${id}: ใช้ข้อมูลสำรอง (ต่างประเทศ) — เพื่ออ้างอิงเท่านั้น`)
        return makeReading(id, tier.origin, value, unit, provenance, warnings)
      }
      warnings.push(`${id}: ชั้น "${provenance}" ไม่มีข้อมูล`)
    } catch (e) {
      warnings.push(`${id}: ชั้น "${provenance}" ล้มเหลว (${e instanceof Error ? e.message : 'error'})`)
    }
  }
  // Unreachable if a sim tier is present; guard defensively without throwing to callers.
  return makeReading(id, 'domestic', null as unknown as T, unit, 'sim', [
    ...warnings,
    `${id}: ไม่มีชั้นข้อมูลใดใช้งานได้`,
  ])
}
