# Variant 3 — Notion-Warm

## Design stance
**Light, document-like, sidebar-driven.** The interface feels like a Notion page you own. Generous breathing room, warm cream backgrounds, serif headings. Navigation is permanent (left sidebar); the main area is a single long page that scrolls naturally.

## Key choices
- **Layout:** Permanent left sidebar (260px) + main area with a cover image header, then content blocks (callout, KPIs, table). Not a "list page" — a "page about your lands."
- **Typography:** Lora serif for H1 (40px) and KPI values — soft, editorial, distinctive. IBM Plex Sans Arabic for body. Inter for nav. Mixed serif/sans gives Notion's signature.
- **Color:** Warm cream (#fbfbfa) page, slightly darker (#f7f6f3) sidebar, soft amber cover gradient (#f7e5d0 → #f7c34a). Black text (#37352f — Notion's signature, not pure black). Status pills are pale tints (mint, sky, amber, gray).
- **Cover:** Gradient banner at top, big icon tile floating into content (Notion's exact pattern).
- **KPI cards:** Tile-on-cream (#f7f6f3), serif numbers, no shadows. Calm.
- **Table:** Notion's row-by-row table — no `<thead>`, just thin separators (#ebebea), inline icons per row.
- **Borders:** Hairline `#ebebea` everywhere. No shadows on the main table.
- **CTA:** Soft amber pill (#f7c34a) for primary. Soft gray (#00000014) for secondary.

## Trade-offs
- **Strong at:** Long sessions, calm feel, hierarchical navigation, brand storytelling, low cognitive load.
- **Weak at:** Scannability of many records, sort/filter workflows, power-user keyboard-first interactions, mobile (sidebar needs to collapse).

## Best for
- Teams that want the lands page to feel like a workspace, not a database. Editorial/marketing-oriented users. Land owners who manage a portfolio, not a queue.
- Brands: Notion, Substack, Coda, Pitch.
