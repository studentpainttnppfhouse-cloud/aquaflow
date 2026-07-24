// ─── Track B · LEARN — end-to-end tester harness ─────────────────────────────
// Runs the whole two-track pipeline on committed seed data so you can see "how
// it works when everything's applied", before real endpoints/keys exist.
//
//   npm run learn:test
//
// It: loads the historical table → runs (advisory) calibration → builds the
// local knowledge index and grounds a sample recommendation → and demonstrates
// the Track A adapter degradation ladder (live → cache → sim, international →
// backup) using the real runTiers()/Reading envelope, with NO network calls.

import { loadHistory } from './history/load'
import { calibrate, writeCalibration } from './calibrate'
import { buildIndex, loadCorpus, retrieve } from './knowledge/index'
import { groundRecommendation } from './knowledge/ground'
import { LocalEmbeddingProvider } from './knowledge/provider'
import { runTiers, PROVENANCE_META, type Reading } from '../data/adapters/types'

const h = (s: string) => console.log(`\n\x1b[1m\x1b[36m${s}\x1b[0m`)
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

function printReading(r: Reading<unknown>) {
  const meta = PROVENANCE_META[r.provenance]
  console.log(
    `  ${r.source.padEnd(18)} → provenance=\x1b[1m${r.provenance}\x1b[0m (${meta.th}) ` +
      `confidence=${r.confidence} usableForDecision=${r.usableForDecision}`,
  )
  for (const w of r.warnings) console.log(dim(`      • ${w}`))
}

async function main() {
  console.log('\x1b[1m🌊 AquaFlow · Track B tester — offline pipeline on seed data\x1b[0m')

  // ── 1) Historical loader ────────────────────────────────────────────────
  h('1) Historical dataset')
  const table = loadHistory()
  console.log(`  loaded ${table.rows.length} rows from: ${table.sourcesUsed.join(', ')}`)
  for (const r of table.rows) {
    console.log(dim(`      ${r.timestamp.slice(0, 10)}  ${r.rainfall_mm}mm  → ${r.outcome}  (${r.event})`))
  }

  // ── 2) Offline calibration (advisory) ───────────────────────────────────
  h('2) Calibration (ADVISORY — not applied to live path)')
  const report = calibrate(table)
  console.log(`  current  : ${JSON.stringify(report.current)}`)
  console.log(`  suggested: ${JSON.stringify(report.suggested)}`)
  report.rationale.forEach((r) => console.log(dim(`      • ${r}`)))
  const out = writeCalibration(report)
  console.log(dim(`      wrote ${out}`))
  console.log(`  \x1b[33m${report.advisory}\x1b[0m`)

  // ── 3) Local knowledge / RAG ────────────────────────────────────────────
  h('3) Knowledge / RAG (local, no external API)')
  const provider = new LocalEmbeddingProvider()
  const index = buildIndex(provider, loadCorpus())
  console.log(`  embedded ${index.length} docs with "${provider.id}"`)
  const query = 'สูบน้ำลงแม่น้ำช่วงน้ำทะเลขึ้น ปลอดภัยไหม'
  console.log(`  query: "${query}"`)
  for (const hit of retrieve(index, provider, query, 3)) {
    console.log(`      [${hit.score}] ${hit.doc.title}  ${dim('(' + hit.doc.source + ')')}`)
  }
  h('   grounding a sample recommendation')
  const grounded = groundRecommendation(index, provider, {
    stationName: 'สถานีสูบน้ำพระโขนง',
    action: 'wait',
    reason: 'น้ำทะเลกำลังขึ้น แม่น้ำเจ้าพระยาเต็ม การสูบตอนนี้จะดันน้ำย้อนกลับ',
  })
  grounded.citations.forEach((c) => console.log(`      [${c.score}] ${c.doc.title}`))
  console.log(dim(`      ${grounded.disclaimer}`))

  // ── 4) Track A adapter degradation ladder (no network) ──────────────────
  h('4) Track A · LIVE — degradation ladder & backup invariant')
  const canal = await runTiers<{ ok: boolean }>('canalRiverLevel', 'm', [
    { provenance: 'live', origin: 'domestic', run: () => { throw new Error('endpoint down (simulated)') } },
    { provenance: 'cache', origin: 'domestic', run: () => ({ ok: true }), note: 'ใช้สแนปช็อตที่คอมมิตไว้' },
  ])
  printReading(canal)

  const rainfall = await runTiers<{ mm: number }>('rainfall', 'mm', [
    { provenance: 'live', origin: 'domestic', run: () => null, note: 'TODO(paint): HII/กรมอุตุฯ ยังไม่เชื่อมต่อ' },
    // International tier declared as 'live' on purpose — runTiers must force it to 'backup'.
    { provenance: 'live', origin: 'international', run: () => ({ mm: 12 }) },
  ])
  printReading(rainfall)

  const tide = await runTiers<{ h: number }>('tideLevel', 'm', [
    { provenance: 'live', origin: 'domestic', run: () => null },
    { provenance: 'backup', origin: 'international', run: () => { throw new Error('marine API down (simulated)') } },
    { provenance: 'sim', origin: 'domestic', run: () => ({ h: 1.2 }), note: 'แบบจำลองฮาร์มอนิก' },
  ])
  printReading(tide)

  console.log('\n\x1b[1m\x1b[32m✓ pipeline ran end-to-end on seed data — no network, no crash.\x1b[0m')
}

main().catch((e) => {
  console.error('\x1b[31mtester failed:\x1b[0m', e)
  process.exitCode = 1
})
