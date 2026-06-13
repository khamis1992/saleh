# Variant 2 — Airtable-Records

## Design stance
**Light, friendly, view-centric.** Every record is a colorful card. The interface is a workspace, not a dashboard — it invites you to click into a record rather than scan a table. Color-coded top stripes turn status into a glance.

## Key choices
- **Layout:** Header → view-tabs row (Airtable-style: All / Available / In dev / High value / Recent) → toolbar (search + filter buttons with counts) → 3-column card grid.
- **Typography:** DM Sans + IBM Plex Sans Arabic. Friendly geometric, no aggressive tracking. Larger card titles (15px weight 600) for a more conversational feel.
- **Color:** Warm canvas (#f6f5f1 cream) with pure white cards. Each card has a **color-coded top stripe** (emerald / blue / amber gradient) tying it to its status. Yellow accent for filter-count badges (#fcb400 — Airtable's signature).
- **Cards:** Flat, rounded (6px), thin shadow. Each shows: status stripe → title + code + status tag → field rows (label/value) → footer (project badge + hover actions).
- **Borders:** `1px solid #d8d6cd` (warmer than Vercel). Buttons + cards are solid.
- **View tabs:** Multi-row, Airtable style — each tab is a different "view" of the same data, not a view-mode toggle. Active tab visually merges with the table below.
- **"Add record" tile:** A dashed-border tile lives in the grid, signaling that this is a workspace where you add things.

## Trade-offs
- **Strong at:** Visual differentiation, scanning 10-30 records, brand personality, click-to-explore workflows.
- **Weak at:** High-density (>50 records), tabular data (sort by multiple columns is awkward in cards), enterprise feel.

## Best for
- Real estate teams who think in records, not rows. Property managers comparing options. Sales-style workflows where each land is a deal.
- Brands: Airtable, Notion databases, Monday.com, Pipedrive.
