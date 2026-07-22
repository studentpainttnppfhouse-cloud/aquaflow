# Design

Target visual system for the "command-center" redesign. Both views (Control Center, Citizen app) share these tokens; Citizen app applies them with a lighter touch (smaller type scale, no uppercase-label chrome) since it's a different device/context, not a different brand.

## Color

OKLCH-equivalent hex tokens, defined in `tailwind.config.js` under `theme.extend.colors.hud`:

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0E14` | Page background, gradient start |
| `bg2` | `#10151F` | Gradient end (`bg-gradient-to-b from-hud-bg to-hud-bg2`) |
| `panel` | `rgba(20,27,38,0.85)` | Card/panel surface — dark slate glass |
| `panelSolid` | `#141B26` | Opaque panel surface (Leaflet popups, over map tiles) |
| `edge` | `rgba(45,224,200,0.16)` | Panel border — low-alpha cyan |
| `edgeStrong` | `rgba(45,224,200,0.4)` | Hover/focus border, active panel border |
| `track` | `#1B2434` | Neutral track/divider where cyan-alpha would disappear (progress dots, chart tracks) |
| `cyan` | `#2DE0C8` | Primary accent — active/live state, connection & flow lines, primary actions |
| `coral` | `#FF6B4A` | Alert accent — critical/risk status and warnings ONLY, never decorative |
| `amber` | `#FBBF24` | Watch-tier status (between ok and critical) — same warm family as coral, one step down in urgency |
| `green` | `#34D399` | OK / normal status |
| `text` | `#E8EDF2` | Primary text |
| `dim` | `#7C8B9C` | Secondary text, labels |

Status semantics unchanged: ok=green, watch=amber, risk=coral, pumping=cyan, live-feed=cyan/green pulse. Coral replaces the old flat red for "risk" so the only two truly saturated colors on screen are cyan (go/live) and coral (stop/warn) — everything else is desaturated navy or muted text.

## Type

- **Sans / labels** (`font-sans`): Inter → IBM Plex Sans → Noto Sans Thai fallback. Used uppercase, `tracking-[0.12em]`, 10–11px, for panel headers, section labels, status pills — instrument chrome, not prose.
- **Thai body** (`font-thai`): Noto Sans Thai (existing) — all Thai prose/copy/reasoning text, unchanged default on `<body>`.
- **Data / mono** (`font-mono`): JetBrains Mono → IBM Plex Mono → ui-monospace. Applied only to numeric readouts (%, mm/hr, m, counts) with `tabular-nums`, never to full Thai sentences (mixed Thai+number strings keep the Thai unit text in sans/thai, only the digits in mono).

Google Fonts loaded in `index.html`: Inter (500/600/700), JetBrains Mono (500/600/700), existing Noto Sans Thai retained.

## Layout (Control Center)

1. **Top status bar** — fixed, never collapses: logo/system name, live STATUS pill, clock, operator chip.
2. **Conditions/controls strip** — rain & tide chips (with provenance badges), ops-mode toggle, storm simulator, reset. Always visible, not part of the top bar (keeps the top bar minimal per spec).
3. **Narration strip** — one live sentence, unchanged behavior, restyled.
4. **Quick-stat strip** — 4 stat cards (station count, active pumping, avg level, 3h rain forecast), mono numerals.
5. **Main row**: map (flex-1, primary weight) + right rail (stacked `CollapsiblePanel`s: AI Recommendations [fills remaining height, default open], Node Detail [conditional on map selection], Activity Log [default open], Rainfall Radar [default collapsed], Per-Station Levels [default collapsed]).
6. **Gauge cluster** (collapsible, default open): 3 vertical fill-bar gauges (City Risk, Network Avg Level, Official River/Canal Gauge) + tide trend line chart.
7. **Footer strip** — fixed: system health % (share of feeds reporting live), network load % (active pumping capacity ÷ total capacity), action buttons (Manual Override, Alerts, Map View, Reports).

Mobile (`<lg`): everything becomes an accordion stack, map panel first, all side/gauge panels default collapsed to save space (existing `order-*` pattern preserved so map stays first regardless of DOM order).

## Components

- **`CollapsiblePanel`** (new, shared): header with icon + uppercase label + optional badge + chevron; body animates open/closed via a `grid-template-rows` 0fr↔1fr transition (not `max-height`, so it composes with internal `flex-1` scrolling lists); state persisted to `sessionStorage` per panel id; `fill` prop lets one panel claim remaining flex space so collapsing a sibling actually reflows the rail.
- **`GaugeBar`** (new): vertical fill-bar gauge — label, mono numeric readout, colored fill (green/amber/coral by threshold).
- Station markers, canal flow-lines, radar, tide chart: same real data/animations, restyled to the new palette + subtle glow (`box-shadow`/`filter: drop-shadow`) on active/pumping/risk states.

## Motion

Existing: station pulse rings (`stn-risk`/`stn-pumping`), canal dash-flow, radar sweep/blobs, narration fade-in — kept, recolored. New: panel collapse (grid-rows transition, ~300ms `cubic-bezier(0.16,1,0.3,1)`), chevron rotate, gauge fill transition. All new motion added to the existing `prefers-reduced-motion` kill-switch in `src/styles/index.css`.
