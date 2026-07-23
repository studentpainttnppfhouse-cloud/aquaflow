import type { DataFeed } from '../data/types'
import type { Provenance } from '../data/adapters/types'

// Accepts either the new unified Provenance or the legacy DataFeed union.
type Feed = Provenance | DataFeed | undefined

function normalize(feed: Feed): Provenance {
  switch (feed) {
    case 'cached':
      return 'cache'
    case 'modeled':
      return 'sim'
    case 'live':
    case 'cache':
    case 'sim':
    case 'backup':
      return feed
    default:
      return 'sim'
  }
}

const LABEL: Record<Provenance, string> = { live: 'สด', cache: 'แคช', sim: 'จำลอง', backup: 'สำรอง' }
const DOT: Record<Provenance, string> = {
  live: 'bg-emerald-400',
  cache: 'bg-amber-400',
  sim: 'bg-sky-400',
  backup: 'bg-fuchsia-400',
}

/**
 * Honest data-provenance chip: green "สด" = live domestic API, amber "แคช" = committed
 * fallback snapshot, blue "จำลอง" = computed model, purple "สำรอง" = international backup
 * (labeled, never authoritative for a decision).
 */
export default function LiveBadge({ feed, title }: { feed: Feed; title?: string }) {
  const p = normalize(feed)
  return (
    <span
      title={title ?? (p === 'backup' ? 'ข้อมูลสำรองจากต่างประเทศ — เพื่ออ้างอิงเท่านั้น' : undefined)}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-1.5 py-px text-[10px] leading-4 opacity-90"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[p]} ${p === 'live' ? 'animate-pulse' : ''}`} />
      {LABEL[p]}
    </span>
  )
}
