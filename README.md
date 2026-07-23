# 🌊 AquaFlow — ระบบประสานงานสูบน้ำและประตูระบายน้ำ กทม.

**UTCC AI Hackathon 2026 · AI + STEM for Thai water management · "software over concrete"**

Bangkok's ~190 pump stations and floodgates largely operate independently, and often
pump against the Chao Phraya tide — draining one district straight into the next.
AquaFlow is a working demo of a *coordinated* network: a real map of real stations,
live rain/tide data, and an AI plan that an operator approves — with a citizen app
that sees the same event in real time.

Two perspectives, one shared live state:

- **🖥️ Control Center** (government, desktop, dark HUD) — real Leaflet map of Bangkok
  with **~190 pump stations / floodgates / drainage tunnels across all 50 districts**,
  a **glowing Chao Phraya main line** that the city's water discharges into from every
  side, live weather + tide chips, and a plan that **updates itself continuously from
  the rain radar** (no per-station clicking required).
  - **Areas rail** — every district as a sortable card (by risk / level / stations-to-drain
    / name); each area can be **activated with an approval gate** before its plan runs.
  - **Notifications & approvals rail** — pre-contemplated plans and *flood-soon* warnings
    arrive here with **Approve / Reject**; approving runs that area's drain plan automatically.
  - **Three ops modes** — แนะนำ–ยืนยัน (approve everything) · กึ่งอัตโนมัติ · **⚡ อัตโนมัติ**
    (a self-balancing *equalizer* that drains and levels the network on its own to keep risk low).
  - **Click any station → a floating detail card**; open the **per-station planner drawer**
    for in-depth real-time info and a clear **"OK to discharge more, or not"** verdict based on
    downstream-node headroom and the Chao Phraya tide.
  - **Richer bottom bar** — gauges + tide plus total discharge online, capacity utilisation,
    at-risk / watch counts, active areas, 3-h rain, and river intake headroom.
- **📱 Citizen app** (mobile, light, phone-framed) — your district's flood risk,
  nearby canal levels, a local mini-map, push-style alerts, and safety tips.
  When the operator approves a drain action, the citizen card visibly eases red → green.

## 📣 Reach every phone — multi-channel alerting

A dashboard only helps people who are looking at it. AquaFlow's alerting layer is
built so a warning lands on **every** phone in a district — a basic feature phone
with no app and weak signal included — not only on smartphones:

- **One `sendAlert()` fans out over four channels** (`src/engine/alerting.ts`):
  📩 **SMS** (every handset) · 📡 **Cell Broadcast** (emergency broadcast to a whole
  cell tower) · 💬 **LINE** (smartphone users) · 📞 **สายด่วนเสียง / IVR** (an
  automated Thai voice call + in-app read-aloud for the elderly and non-readers).
- **Every provider sits behind one `ChannelProvider` interface**, so a real gateway
  drops in unchanged — Twilio / ThaiBulkSMS / AIS / TrueMove for SMS, Thailand's
  **DDPM (ปภ.) Cell Broadcast**, the **LINE Messaging API**, and a voice/IVR provider.
  The exact plug-in points are marked `--- REAL GATEWAY GOES HERE ---` in the code.
- **The AI drives it end-to-end**: each district gets a severity on the escalation
  ladder (🟢 ปกติ · 🟡 เฝ้าระวัง · 🟠 เตือนภัย · 🔴 ฉุกเฉิน), the planner **auto-drafts a
  plain-Thai message** for that severity, and the operator broadcasts to one zone or
  **one-taps "กระจายเตือนทุกเขตที่เสี่ยง"** to hit every affected district at once.
- **Honest telecom detail**: Thai SMS is UCS-2, not GSM-7, so the UI reports the true
  segment count (70 chars / part, 67 concatenated) and messages are kept plain — no
  emoji dependence — so they render on a feature phone.
- **Delivery ledger + retry**: fan-out shows live per-channel `sent/total` counts,
  retries failures up to 3× with backoff, and **never fails silently** — an exhausted
  send ends visibly as `failed`.
- **Offline resilience**: flip the connectivity simulator and new alerts are **queued**,
  then automatically **flushed on reconnect** — an alert is never dropped on a bad link.
- **Zone registry** (`src/data/zones.ts`): per-district population + a representative
  contact roll grouped by role (ประชาชน / ผู้นำชุมชน / เจ้าหน้าที่). Every name and phone
  number is **synthetic and deterministic — no real personal data** — standing in for
  the อบต./เขต rolls and telecom cell-area maps a production deployment would hold.

HONESTY NOTE: like the rest of the demo, the fan-out is **simulated and labeled
"จำลอง"** — no carrier is actually contacted; the value is the working end-to-end
loop and the drop-in provider seams.

## Run it

```bash
npm install
npm run dev      # local dev
npm run build    # production build (dist/)
```

Deploys to **GitHub Pages** automatically on push to `main`
(`.github/workflows/deploy.yml` — enable Pages → "GitHub Actions" in repo settings).
The workflow sets `GITHUB_PAGES=true` so Vite uses the `/aquaflow/` base path.
Vercel also works with zero config (base defaults to `/`).

## Real data sources

Every source goes through an adapter (`src/data/adapters/`) that tries the live
endpoint and **falls back to a committed snapshot** (`src/data/fallback/`) so the
demo can never break offline. The UI shows an honest provenance badge everywhere:
🟢 **สด** (live API) · 🟡 **แคช** (cached snapshot) · 🔵 **จำลอง** (mathematical model).

| Source | Endpoint | Key? | Used for |
| --- | --- | --- | --- |
| **Open-Meteo forecast** | `https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.52&hourly=precipitation,rain,precipitation_probability&forecast_days=2&timezone=Asia/Bangkok` (the adapter batches all station coordinates into one call) | No | Real per-station rain forecast, weather chip, radar panel — the guaranteed live integration |
| **Open-Meteo Marine** | `https://marine-api.open-meteo.com/v1/marine?latitude=13.45&longitude=100.59&hourly=sea_level_height_msl&forecast_days=2&timezone=Asia/Bangkok` | No | Gulf of Thailand sea level → tide phase for the pumping logic |
| **WorldTides** (optional) | `https://www.worldtides.info/api/v3?heights&lat=13.45&lon=100.59&days=2&key=…` | Yes (`VITE_WORLDTIDES_KEY`) | Preferred tide source when a key is provided |
| **ThaiWater / HII (สสน.)** | `https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load` | No (CORS varies) | Official Bangkok canal/river gauge readings in the citizen view |
| **Bangkok Open Data (CKAN)** | `https://data.bangkok.go.th/api/3/action/package_search?q=สถานีสูบน้ำ` → first JSON/GeoJSON resource | No (CORS varies) | Best-effort replacement of seed coordinates with official สำนักการระบายน้ำ geometry |

If no tide source is reachable, the tide is a harmonic model (M2 + K1 constituents
seeded to a realistic Bangkok bar range) and is **labeled "จำลอง / modeled"** in the UI.

Keys go in `.env` (see `.env.example`); never commit secrets.

## Honesty labels (read this, judges 🙂)

- **The "AI" is a transparent heuristic planner** (`src/engine/recommend.ts`), not a
  trained model — a deliberate stand-in shaped so an ML/RL policy can replace it
  behind the same `recommend()` interface. It is tide-aware (pump while the river
  is falling), inflow-aware (per-station Open-Meteo forecast), and coordinated
  (never recommends every station discharging into the same downstream node —
  the anti-"move-the-flood-elsewhere" rule staggers them).
- **Station coordinates are approximate** (`approx: true` in
  `src/data/fallback/stations.json`), seeded from public records of real
  installations; the adapter upgrades them with official open-data geometry when
  reachable. Canal polylines are coarse hand-traced routes, labeled in popups.
- **Per-pump water levels are simulated** (no public per-pump telemetry exists);
  official gauge readings appear separately, badged with their provenance.
- Rain snapshot fallback is synthetic but schema-accurate, re-stamped onto the
  current date so afternoon-storm patterns line up with the demo clock.

## Architecture

```
src/
  store/useAppStore.ts    # zustand shared state — one live simulation both views read
                          # rAF easing loop: risk & levels glide to targets over ~1–2 s
  data/adapters/          # openMeteo · thaiWater · tide · stations (live → fallback)
  data/fallback/          # committed snapshots: stations, canals, waterLevels, openMeteo
  data/zones.ts           # synthetic per-district population + recipient roll (by role)
  engine/recommend.ts     # coordinated heuristic planner (ML-replaceable interface)
  engine/alerting.ts      # multi-channel fan-out (SMS/cell broadcast/LINE/voice),
                          # severity ladder, Thai message drafting, retry — provider-abstracted
  views/control/          # ControlCenter · MapPanel · RecommendationPanel · RiskGauge
                          # StatStrip · Narration · BroadcastPanel · SidePanels (bars, radar, tide)
  views/citizen/          # CitizenApp · HeroStatus · CanalList · Alerts · MiniMap
```

Stack: Vite · React 18 · TypeScript · Tailwind · Leaflet + react-leaflet
(CARTO `dark_all` / `light_all` basemaps) · Zustand.

## Demo script (2 minutes)

1. Landing → **ศูนย์ควบคุม** → 3-step guide → real Bangkok map with live weather chip.
2. Press **⛈️ จำลองพายุฝน** — levels climb, stations turn amber/red, the AI panel fills
   with a *staggered* plan (note the tide reasoning and the "same downstream node" waits).
3. Press **ดูเหตุผล** on the top card, then **อนุมัติ** — the canal animates flow toward
   the river, the risk gauge eases down, the narration strip reports progress.
4. Switch to **📱 ประชาชน** (top-right) — the same district eases from red toward green,
   with the "🛟 ศูนย์ควบคุมกำลังเร่งระบายน้ำ" banner live.
