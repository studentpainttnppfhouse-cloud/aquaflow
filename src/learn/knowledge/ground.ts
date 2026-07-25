// ─── Track B · LEARN — ground operator explanations ──────────────────────────
// Given a planner recommendation, retrieve supporting knowledge snippets to
// SHOW ALONGSIDE the explanation for the human operator. This is read-only
// grounding: it must never be fed back into the planner or alter a decision.

import type { IndexedDoc, Retrieval } from './index'
import { retrieve } from './index'
import type { KnowledgeProvider } from './provider'

/** Minimal shape of a recommendation we can ground (matches engine/recommend output). */
export interface GroundableRec {
  stationName: string
  action: 'pump' | 'open_gate' | 'wait'
  reason: string
}

export interface GroundedExplanation {
  rec: GroundableRec
  citations: Retrieval[]
  /** Explicit reminder for the UI: grounding is advisory context, not a decision input. */
  disclaimer: string
}

const ACTION_HINT: Record<GroundableRec['action'], string> = {
  pump: 'สูบน้ำ สถานีสูบ ระบายลงแม่น้ำ',
  open_gate: 'ประตูระบายน้ำ เปิดประตู แรงโน้มถ่วง',
  wait: 'รอ น้ำทะเลขึ้น ไหลย้อน จัดคิว',
}

export function groundRecommendation(
  index: IndexedDoc[],
  provider: KnowledgeProvider,
  rec: GroundableRec,
  k = 2,
): GroundedExplanation {
  const query = `${rec.stationName} ${ACTION_HINT[rec.action]} ${rec.reason}`
  return {
    rec,
    citations: retrieve(index, provider, query, k),
    disclaimer: 'บริบทอ้างอิงสำหรับเจ้าหน้าที่เท่านั้น — ไม่ถูกใช้เป็นอินพุตในการตัดสินใจของตัววางแผน',
  }
}
