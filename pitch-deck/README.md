# ชลชาญ / AquaFlow — Pitch Deck

19-slide pitch deck for **AquaFlow** (ชลชาญ), built to the *AquaFlow Pitch Deck
Design Brief* but populated with the **real product** — Bangkok's pump-station /
floodgate coordination system, as shipped in this repo (see `../PRODUCT.md`,
`../README.md`).

- **Deliverable:** `AquaFlow-Pitch-Deck.pptx` (1920×1080, 16:9)
- **Generator:** `build.js` (pptxgenjs) — edit and re-run to regenerate
- **Photo assets:** `IMAGES.md` (Higgsfield image links to drop into slides 03/04/13)

## Design system (from the brief)

| Element | Choice |
|---|---|
| **Motif** | Water-level staff gauge (เสาวัดระดับน้ำ) — a vertical rail down the left edge of every slide; the slide number is its "reading" and the water rises through the deck to full by slide 19. |
| **Palette** | 6 values only: `--khlong #0F3D3E`, `--paddy #1B7A6B`, `--gauge #D62828` (flood line — one use/slide), `--drought #E3B23C`, `--sluice #EDEEE9`, `--ink #0A1F20`. |
| **Type** | Chakra Petch (display), Anuphan (Thai/Latin body), IBM Plex Mono (numbers). All free Google Fonts. |

**Fonts:** install [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch),
[Anuphan](https://fonts.google.com/specimen/Anuphan) and
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) before opening
in PowerPoint, or Thai renders via substitution.

## What's real vs. what you must fill in

Real, sourced content is baked in (≈190 independent stations; 2011 flood cost;
Open-Meteo / Marine / ThaiWater data sources; the transparent, ML-replaceable
heuristic planner; the coordination "don't move the flood downstream" rule;
Control Center + Citizen app; the honesty caveats).

`[SQUARE BRACKET]` placeholders are left **deliberately** wherever the brief
requires a specific figure you must own before pitching — do not present with
brackets showing:

- **03** — replace the sample quote with one real interview.
- **11** — the RESULT metric (e.g. % cross-district flooding avoided vs a timer baseline).
- **14** — real software costs (dev, hosting, maintenance).
- **15** — water / households / capex per scale tier.
- **17** — team names, roles, and one proof point each.

## Regenerate

```bash
cd pitch-deck && npm i pptxgenjs && node build.js
```
