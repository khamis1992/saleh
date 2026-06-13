# /lands Page Redesign Brief (Light-Mode, Premium SaaS Aesthetic)

## Project
- File: `src/pages/lands/LandListPage.tsx` (1048 lines currently)
- Route: `http://localhost:5173/lands`
- Stack: React + Vite + Tailwind v4 + Radix UI + lucide-style icon set at `@/components/icons/IconSet`
- Dev server: running at :5173

## Aesthetic rules (HARD — non-negotiable)

This user is a strong light-mode-only design preference. The redesign MUST be:
- **Canvas**: `#fafbfc` near-white; **Surfaces**: pure white; **Borders**: 1px `#eef0f3` hairline
- **Shadows**: `0 1px 2px rgba(15,23,42,0.04)` whisper, `0 4px 12px rgba(15,23,42,0.06)` hover lift, `0 4px 12px rgba(37,99,235,0.08)` active filter glow — NEVER `shadow-xl` or `shadow-2xl`
- **Primary CTA**: `#533afd` (project brand indigo) on `bg-[#533afd] hover:bg-[#4434d4]` — but for *light* accent surfaces, blue-600 family
- **Status pills**: ALWAYS `bg-{tone}-50 text-{tone}-700` + `bg-{tone}-500` colored dot. NEVER solid colored blocks.
- **Header band**: `bg-gradient-to-l from-blue-50 via-sky-50 to-emerald-50` with faint radial dot pattern that fades to transparent. NEVER `from-indigo-900`/`from-slate-900`/dark hero.
- **Numerals**: `ltr-only` class (defined globally) with `fontVariantNumeric: 'tabular-nums'`. Arabic labels stay RTL.
- **Cover header**: tinted gradient + icon tile chip + breadcrumb chip "بنك الأراضي" + H1 + paragraph + stat row + action buttons.

## Anti-patterns to REJECT
- ❌ Dark hero gradients (indigo-900, slate-900)
- ❌ Glassmorphism on dark surfaces
- ❌ Solid `bg-emerald-500 text-white` status blocks
- ❌ `shadow-xl` / `shadow-2xl` / dark shadow lifts
- ❌ `bg-white/10 backdrop-blur` over dark surfaces
- ❌ Decorative stats / fake dashboards / generic SaaS cards
- ❌ `from-indigo-` / `from-slate-900` / `from-gray-900` / `from-black` gradient prefixes
- ❌ `bg-[#1d1d1f]` / `bg-gray-900` / `bg-slate-900` / `bg-indigo-900` / `bg-black` backgrounds
- ❌ `text-shadow` / text glows

## Pre-anti-pattern grep (run after writing)
```
grep -nE 'bg-(gray-9|slate-9|indigo-9|black)|from-(indigo-9|slate-9|gray-9|black)|bg-\[#1d1d1f\]|shadow-(xl|2xl)' src/pages/lands/LandListPage.tsx
```
→ MUST return 0 matches.

---

## Feature inventory (READ-ONLY — must be 100% preserved)

The current page already has 100% of the features below. The redesign must keep ALL of them.

### KPI strip (4 tiles, top of page)
1. **إجمالي الأراضي** (Total Lands) — count, total area, click → reset all filters, active when no filter applied
2. **متاحة للتطوير** (Available) — count, click → set status=available
3. **قيد التطوير** (Under development) — count + `underDevCount`, click → status=under_construction
4. **القيمة التقديرية** (Estimated value) — total value, sub: `التكلفة: <cost>`, trend % chip

### Cover header (top banner)
- Icon tile (Layers, indigo)
- "بنك الأراضي" pill chip + "إدارة الممتلكات" subtitle
- H1 title (from `t.lands.title`)
- Description paragraph
- Inline stat row: إجمالي / المساحة / القيمة
- Buttons: "تصدير CSV" (outline) + "إضافة أرض جديدة" (primary)

### Filter sidebar (left rail, sticky)
- Search input (debounced/auto on change)
- Status filter (8 options + All, with counts)
- Usage filter (dynamic from data + All, with counts)
- Period filter (radio: all/30d/90d/year)
- Location/Municipality filter (dynamic, checkbox + counts, only if any)
- Reset button (only shown when activeCount > 0)

### Toolbar (right of sidebar)
- Mobile-only: "الفلاتر" button with active count badge + mobile search input
- Sort: `<Select>` of 8 fields (land_code, land_name, municipality, area_sqm, zone, status, acquisition_date, estimated_value) + asc/desc toggle
- View-mode segmented control: جدول (table) / بطاقات (grid) / خريطة (map)

### Status bar (between toolbar and content)
- Result count: "X نتيجة [من Y]" when filtered
- Active filter chips (status, usage, location, period, search) — each removable
- "إعادة تعيين الكل" link when any chip present
- Sort indicator (right side, table mode only)

### Table mode
Columns: رقم الأرض (sort) · الموقع (sort, name + plot) · البلدية (sort) · المساحة (sort, mono) · الاستخدام (sort, pill) · الحالة (sort, pill) · المشاريع (count chip → /projects) · القيمة (sort) · إجراءات (3 icons)
- Click row → navigate to `/lands/<id>`
- Copy code button (with Pin icon, "تم نسخ الكود" toast)
- Tooltip on code, view, edit, delete buttons
- Action column stops propagation
- Row hover = `bg-blue-50/30`

### Grid mode
- 1/2/3/4 columns by breakpoint
- Card top: usage-tinted header, big usage icon in white tile, status pill (top-right)
- Card body: location, area (mono + m²), acquisition date (optional)
- Card footer: estimated value (TrendingUp + green dot) + project count chip
- Hover: lift, reveal 3 icon buttons (top-right overlay, stops propagation)
- Click card → navigate to detail

### Map mode
- `LandMap` component (Leaflet) at height 560px
- Floating overlay card (top-right): totals (إجمالي, متاحة, قيد التطوير)
- Marker click → navigate to detail

### Pagination
- Rows-per-page select (6/8/12/24)
- "عرض A – B من N" label
- First/prev/numbered/next buttons
- Current page highlighted with brand color
- Disabled state at edges

### Delete confirmation
- AlertDialog with red-50 icon avatar, title, description (land name + code), cancel + delete (red-600)

### Empty state
- Two variants: "no results" (filters active) vs "no lands yet" (no filters)
- Gradient icon tile + Sparkles badge
- Dual CTA: reset filters + add new

### Helper sub-components (preserve as named functions)
- `Stat`, `KpiTile`, `Sparkline`, `FilterSidebar`, `CheckboxRow`, `RadioRow`, `ViewTab`, `Th`, `Pagination`, `EmptyState`

---

## Design plan (the new visual language)

### Layout (top to bottom)
1. **Cover header** — light tinted band, full width, 64-72px tall content, with icon tile + chip + H1 + paragraph + inline stats + 2 buttons.
2. **KPI strip** — 4-column responsive grid, white cards with sparkline, click-to-filter.
3. **Workspace** — 2-column grid `280px / 1fr`:
   - **Left rail (sticky)**: search, status, usage, period, location, reset.
   - **Right**: toolbar (filter mobile trigger + search + sort + view-mode) → status bar (count + chips + sort indicator) → content area (table / grid / map).

### Visual upgrades (vs current page)
- **KPI tile v2**: add tiny trend chip in top-right when not active + bigger sparkline. Slightly tighter padding.
- **Status bar**: introduce a subtle "tabs" pattern (the segmented view-mode + sort lives in the toolbar, while status bar is purely informational).
- **Table**: add subtle alternating row zebra (`even:bg-gray-50/40`) and a sticky table header that turns glassy on scroll.
- **Grid card**: more breathing room, more premium typography (tracking-tight on title), an emoji-like usage icon on a soft pastel tile.
- **Filter sidebar**: collapsible group headers (chevron + title + active count).
- **Empty state**: redesigned illustration with a soft SVG of layered plots.
- **Add a "filter expansion toggle"**: a small "expand all" link on the sidebar for long filter lists.

### Tokens (must match project brand)
```
Primary CTA:        bg-[#533afd] hover:bg-[#4434d4] text-white shadow-sm shadow-blue-500/20
Accent link:        text-[#533afd] hover:text-[#4434d4]
Active ring:        ring-2 ring-blue-100 border-blue-200
Active glow:        shadow-[0_4px_12px_rgba(37,99,235,0.08)]
```

### Code style requirements
- Keep all imports identical (only add new ones if you need them).
- Keep all state hooks (search, filters, sort, pagination, viewMode, deleteTarget, refresh, showFiltersMobile).
- Keep all handlers (handleSort, handleDelete, handleExport, handleResetFilters, handleCopyCode).
- Keep all navigation calls (`navigate('/lands/<id>')`, `navigate('/lands/<id>/edit')`, `navigate('/lands/create')`, `navigate('/projects')`).
- Keep `landStore`, `projectStore`, `LandMap`, `MapLand`, `generateDemoCoordinates`, `formatQAR`, `formatQARInt`, `formatThousand`, `exportToCSV`, all Radix UI imports.
- Use ONLY icons from `@/components/icons/IconSet` (read it to confirm names). Mapping:
  `Search, X, Plus, MapIcon, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Layers, Home, Building, Tree, Briefcase, Hammer, Check, Archive, Coin, Trending, Refresh, Download, Truck, File, Sort, SortAsc, SortDesc, Folder, Dollar, Grid, List, Location, Calendar, Ruler, Pin, Sparkle, Activity, Sliders, Copy, Bank, Filter`
- Output: TypeScript strict (no `any` leaks), no unused vars, no console.log.
- File length target: 1100-1400 lines (slight expansion OK because the new visual language has more structure).

### Tailwind class hygiene
- Use the project's `ltr-only` utility for ALL numeric spans (area, value, code).
- `dir="rtl"` on the outer page, `dir="ltr"` on numeric spans, `dir="ltr"` on copy code buttons.
- Avoid `bg-gray-900` / `bg-slate-900` / `bg-indigo-900` / `bg-black` / `bg-[#1d1d1f]` in the entire file.
- Avoid `from-indigo-9` / `from-slate-9` / `from-gray-9` / `from-black` gradient classes.
- Avoid `shadow-xl` / `shadow-2xl`.

---

## Verification steps (must run after writing)

1. `cd /c/Users/khamis/Documents/land2 && npx tsc -b 2>&1 | tee /tmp/tsc.log` → must show **0 errors mentioning LandListPage**. (Other files' pre-existing errors are OK.)
2. **Anti-pattern grep**:
   ```bash
   grep -nE 'bg-(gray-9|slate-9|indigo-9|black)|from-(indigo-9|slate-9|gray-9|black)|bg-\[#1d1d1f\]|shadow-(xl|2xl)' src/pages/lands/LandListPage.tsx
   ```
   → MUST return 0 matches.
3. Restart dev server check: dev server is already running at :5173. The page should hot-reload.
4. Don't run browser yourself — Hermes will do the visual verification in the browser tool. Just ensure the file compiles and grep returns clean.

---

## Output format

1. Use `write_file` to **replace** the entire `src/pages/lands/LandListPage.tsx` (NOT a patch — the whole point is a fresh design).
2. After writing, run the tsc and grep checks listed above.
3. Report back: file written, line count, tsc result (0 new errors), grep result (0 matches), any small caveats.

## What NOT to do
- Do NOT patch the existing file incrementally with `patch`. Use `write_file` to rewrite the whole thing.
- Do NOT drop a single feature from the inventory.
- Do NOT add a "dark mode" toggle.
- Do NOT use glassmorphism on dark surfaces.
- Do NOT introduce dependencies not already in the project.
- Do NOT change the route, file path, or component export name (`LandListPage` default export).
