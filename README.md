# 🌊 AquaFlow — ระบบประสานงานสูบน้ำและประตูระบายน้ำ กทม.

**UTCC AI Hackathon 2026 · AI + STEM for Thai water management · "software over concrete"**

Bangkok's ~190 pump stations and floodgates largely operate independently, and often
pump against the Chao Phraya tide — draining one district straight into the next.
AquaFlow is a working demo of a *coordinated* network: a real map of real stations,
live rain/tide data, and an AI plan that an operator approves — with a citizen app
that sees the same event in real time.

Two perspectives, one shared live state:

- **🖥️ Control Center** (government, desktop, dark HUD) — real Leaflet map of Bangkok
  with actual pump stations / floodgates / drainage tunnels, live weather + tide chips,
  per-station levels, a coordinated AI recommendation panel with an approve flow,
  storm simulator, and an activity log.
- **📱 Citizen app** (mobile, light, phone-framed) — your district's flood risk,
  nearby canal levels, a local mini-map, push-style alerts, and safety tips.
  When the operator approves a drain action, the citizen card visibly eases red → green.

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
  engine/recommend.ts     # coordinated heuristic planner (ML-replaceable interface)
  views/control/          # ControlCenter · MapPanel · RecommendationPanel · RiskGauge
                          # StatStrip · Narration · SidePanels (bars, radar, tide)
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
