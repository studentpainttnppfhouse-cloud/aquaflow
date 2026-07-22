# Product

## Register

product

## Users

**Control Center**: Bangkok government flood-control operators (สำนักการระบายน้ำ กทม.), on desktop, during active rain/flood events. They are watching ~190 real pump stations and floodgates, deciding (or pre-authorizing) which ones to fire, under time pressure and tidal constraints — pumping into a full Chao Phraya backfeeds the city. This is an operations instrument used in the moment, not browsed at leisure.

**Citizen app**: Bangkok residents, on mobile, checking their own district's flood risk and nearby canal levels, often one-handed and in a hurry (during or before a storm). They need an instant risk read and a plain-language safety action, not a control surface.

Built for UTCC AI Hackathon 2026 ("software over concrete") — a working demo of coordinated pump/floodgate dispatch, judged live.

## Product Purpose

AquaFlow coordinates Bangkok's independently-operated pump stations and floodgates into one network view, so operators stop draining one district straight into the next. A transparent heuristic planner (explicitly labeled as non-ML, ML-replaceable) proposes a tide-aware, coordinated drainage plan; the operator approves or the system runs pre-authorized semi-auto. The citizen app mirrors the same live state so residents see the effect of an approved action in real time (red → green).

Success = an operator can read network state, understand *why* the AI is recommending an action, and act on it in seconds — not a dashboard that looks impressive but slows the decision down.

## Brand Personality

Command-center, not marketing page. Three words: **instrument, coordinated, honest.**

- *Instrument*: technical typography, monospace data, no decorative flourish. Reads like something an engineer trusts under pressure.
- *Coordinated*: the UI itself should visually demonstrate the network-level thinking the product is built on — connected nodes, flow lines, one shared live state across both views — not a grid of disconnected widgets.
- *Honest*: the product's core credibility feature is its data-provenance badges (live/cached/modeled) and transparent AI reasoning ("ดูเหตุผล"). Visual design must never obscure or decorate over an honesty signal.

## Anti-references

- SaaS dashboard clichés: hero metrics, gradient-text stat cards, decorative glassmorphism, bouncy/elastic motion.
- Nothing should read as a landing page — no marketing rhythm (eyebrows, numbered feature sections) inside the operational views.
- Pure black backgrounds (flat `#000`) — reads cheap, not instrument-grade.
- Color used decoratively: the alert/warning accent is reserved for actual warning states, never for emphasis or branding.
- Hiding real data behind restyled chrome — every existing value, badge, and label must survive the redesign; this is a structural and visual pass, not a content rewrite.

## Design Principles

1. **The map is the product.** Everything else — recommendations, gauges, radar — supports the operator's read of the live network; none of it should compete with the map for primary visual weight.
2. **Numbers read like sensor output.** Monospace, tabular, aligned — an operator scans them, doesn't read them like prose.
3. **Let the operator choose their own density.** Side panels are independently collapsible and remember their state — a returning operator's screen looks like they left it.
4. **Motion signals state, not brand.** Pulses and flow-lines exist only where they carry live information (a node is active, water is moving); nothing animates for delight.
5. **One shared live state, two honest views.** Control Center and Citizen app read the same store; the redesign must preserve that — a citizen sees an operator's approved action reflected instantly.

## Accessibility & Inclusion

- WCAG AA: body text ≥4.5:1 contrast, large/data text ≥3:1, against the new dark palette.
- Station status and alert states must not rely on hue alone: pumping/risk/watch/ok already carry a letter glyph (ส/ป/อ) and icon backup on the map; the redesign keeps and extends that redundancy (position, icon, or label) wherever hue carries meaning, for red-green colorblind operators making real dispatch decisions.
- `prefers-reduced-motion` is already respected (pulse/flow/radar animations disable); all new motion (panel collapse, node glow, flow-lines) must honor it too.
- Thai-language content stays primary throughout; new technical/mono type is additive for data legibility, not a replacement for Thai labels.
