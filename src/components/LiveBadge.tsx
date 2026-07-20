import type { DataFeed } from '../data/types'

const LABEL: Record<DataFeed, string> = { live: 'สด', cached: 'แคช', modeled: 'จำลอง' }
const DOT: Record<DataFeed, string> = {
  live: 'bg-emerald-400',
  cached: 'bg-amber-400',
  modeled: 'bg-sky-400',
}

/** Honest data-provenance chip: green "สด" = live API, amber "แคช" = committed fallback snapshot, blue "จำลอง" = computed model. */
export default function LiveBadge({ feed, title }: { feed: DataFeed; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-1.5 py-px text-[10px] leading-4 opacity-90"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[feed]} ${feed === 'live' ? 'animate-pulse' : ''}`} />
      {LABEL[feed]}
    </span>
  )
}
