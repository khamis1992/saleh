## Variant: Action Hub

### Design stance
Tool-first, action-prominent. Cards as the primary view, filters as visible chips, KPIs as tappable tiles with active state.

### Key choices
- **Layout:** Tinted top band, 4-column KPI grid, prominent filter chip toolbar, **default to grid of cards**
- **Typography:** Inter 400–700, bold H1, slightly bigger values (2xl)
- **Color:** Light blue-50/60 fade on top, gray-50 page, KPI tiles get a status-colored top accent when active (emerald-200 ring)
- **Elevation:** Soft 0 1px 2 + 0 0 0 1px ring — subtle lift on hover
- **Filter UI:** Active filter chips (× to remove) instead of dropdowns, "Status: متاحة ×" inline pattern
- **Sparkline-like trend:** "+14% vs cost" in the value KPI

### Trade-offs
- Strong at: Quick scanning, action discovery, filter visibility, "wow" first impression
- Weak at: Calm reading, big-data density
- Best for: Daily-use power users, ops dashboards, real estate brokers
