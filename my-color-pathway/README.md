# My Color Pathway (prototype)

Clickable first-draft prototype for the RE:YOUTH Case Competition (Thammasat Open House 2026 × COT).
Theme: นวัตกรรมเพื่อคุณภาพชีวิตที่ดีขึ้นของเยาวชน.

> “เด็กไทยรู้จักอาชีพนับร้อยจากหน้าจอ แต่ไม่เคยรู้จักตัวเอง”

A 6-year path (ม.1–ม.6) that lets students “try before they choose”: ลอง (volunteering) → ลงมือ (job shadowing) → เลือก (TCAS portfolio and program suggestions).
The core is a Skill Profile with no scores, no ranking and no peer comparison. All data is mock. There is no backend, login or real TCAS connection.

## Run

```bash
cd my-color-pathway
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

Use the top bar to switch role (นักเรียน, พี่เลี้ยง, ครู, ผู้ปกครอง, กรรมการ) and persona (น้องมิว ม.3 / น้องภูมิ ม.6). The ↺ button resets the demo. Demo state is kept in localStorage.

## Screens

| Route | Screen |
|---|---|
| `#/onboarding` | Onboarding: welcome, interests, first well-being check-in, parental consent |
| `#/` | Home / 6-year journey |
| `#/explore` | Explore opportunities (filter by interest, format, duration, stage) |
| `#/explore/:id` | Opportunity detail + apply (mock) |
| `#/log` | Experience log with evidence and mentor feedback |
| `#/reflect` | Reflection flow |
| `#/profile` | Skill Profile (palette, growth ม.1 → now, evidence, fields that may suit) |
| `#/wellbeing` | Private well-being check-in |
| `#/portfolio` | ม.6 Portfolio Builder + mock TCAS export |
| `#/programs` | ม.6 Program suggestions (save, dismiss, compare) |
| `#/privacy` | Privacy & sharing, consent records, data export/delete |
| `#/mentor` | Mentor dashboard + feedback form |
| `#/teacher/placements` | Placement manager |
| `#/teacher/cohort` | Cohort overview (aggregated, anonymized) |
| `#/parent` | Parent view |
| `#/impact` | Pilot impact KPIs (mock data) |
| `#/about` | Problem, solution, principles, research |

## Structure

`src/pages` screens · `src/components` layout and shared UI · `src/data/mock.ts` all mock data · `src/types` data model · `src/lib/store.tsx` demo state.

Stack: React, TypeScript, Vite, Tailwind CSS, Recharts, lucide-react.
