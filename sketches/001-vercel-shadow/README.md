# Variant 1 — Vercel-Shadow

## Design stance
**Light, data-dense, table-first.** Every surface is white; depth comes from a sophisticated shadow-as-border stack — never from fills or dark backgrounds. The interface treats information like code: compressed, structural, scannable.

## Key choices
- **Layout:** Single-column workspace. Header → 5 KPI strip → toolbar (tabs + sort) → table. No sidebar.
- **Typography:** Geist Sans with IBM Plex Sans Arabic, aggressive negative letter-spacing on headings (-1.28px at 32px, -0.96px at 24px), tabular-nums for all numbers.
- **Color:** Achromatic. Pure white (#ffffff) canvas, near-black (#171717) text, light gray (#4d4d4d / #666) hierarchy. Status pills are the only color (emerald-50/blue-50/amber-50 tints).
- **Depth:** 4-layer shadow stack — `border (1px) + subtle (2px) + ambient (8px) + inner #fafafa ring`. The signature Vercel "glow from within."
- **Borders:** Always shadow, never `border:`. `box-shadow: 0 0 0 1px rgba(0,0,0,.08)`.
- **Action bar:** Dark button (#171717) for primary, ghost button (white + ring) for secondary.
- **Row hover:** Reveals action buttons. Rows are flat with a #fafafa hover state.

## Trade-offs
- **Strong at:** Scanning many records, professional credibility, conveying precision, desktop power users.
- **Weak at:** Visual warmth, brand personality, mobile-first density, storytelling.

## Best for
- Real estate ERP users who live in the table. People who manage 50+ lands and need to find one fast. Power users who appreciate restraint.
- Brands: Vercel, Linear, Stripe Dashboard, Apple.
