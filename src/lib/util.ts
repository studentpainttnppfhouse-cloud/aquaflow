export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Deterministic 0..1 hash of a string — used to give each station a stable per-location variation when only a single-point forecast is available. */
export function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

export function fmtClock(d: Date): string {
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export async function fetchJson<T>(url: string, timeoutMs = 6000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

let idCounter = 0
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`
