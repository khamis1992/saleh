# Land2 — Real Estate Development ERP

A comprehensive Arabic-first ERP system for real estate development, land bank management, property leasing, construction, finance, and HR.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** for dev server and build
- **Tailwind CSS** + **ShadCN UI** for styling
- **Lucide React** for icons
- **TanStack Table** for advanced data tables
- **Sonner** for toast notifications
- **React Hook Form** + **Zod** for forms
- **React Router 6** for routing
- **Recharts** for analytics dashboards
- **Leaflet** for map views
- **DayPilot** for calendar/Gantt
- **localStorage**-backed in-memory stores (no backend required for the demo)

## Features

### Modules
- **Dashboard** — Executive KPIs and activity feed
- **Land Bank** — Land inventory, valuation, purchase tracking
- **Development Projects** — Project lifecycle, phases, budgets
- **Construction Management** — Daily reports, progress, change orders, contractor claims
- **Contractors** — Vendor management with ratings, contacts, banking
- **Procurement** — PRs, POs, goods receipts, quotation comparison
- **Inventory & Warehouses** — Stock levels, transactions, alerts
- **Properties & Units** — Property catalog, unit management
- **Tenants & Leasing** — Tenant CRM, lease contracts, renewals/terminations
- **Rent Collection** — Invoices, receipts, payment schedules
- **Maintenance** — Requests, work orders, inspections, preventive schedules
- **Legal Affairs** — Cases, notices
- **Finance & Accounting** — Chart of accounts, journal entries, bank reconciliation, cheques, period closing
- **HR** — Employees, attendance, leave management, payroll
- **Documents** — Centralized document storage with categorization
- **Reports** — Pre-built reports across all modules
- **Settings** — Company info, roles & permissions, numbering sequences
- **Activity Log** — User action audit trail

### Cross-cutting
- **Arabic RTL-first** with full English translation infrastructure (locale switcher)
- **QAR currency formatting** with proper localization (en-US numerals)
- **localStorage-based persistence** — all data is in-memory client-side with seed data, perfect for demos
- **Responsive design** — works on mobile, tablet, and desktop
- **Dark sidebar** with light content area
- **Standardized UI** — unified table design, button colors, badge styles across the system

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20+)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/khamis1992/saleh.git
cd saleh

# Install dependencies
npm install

# Copy environment template (Supabase is optional — the app works without it)
cp .env.example .env

# Start the dev server
npm run dev
```

The app will be available at http://localhost:5173

### Build

```bash
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Preview the production build locally
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/        # Shared UI components
│   ├── ui/           # ShadCN primitives (Button, Table, Dialog, etc.)
│   ├── layout/       # Sidebar, Header, Layout
│   ├── shared/       # PageHeader, StatCard, StatusBadge, etc.
│   ├── dashboard/    # Dashboard widgets
│   └── maps/         # Leaflet map components
├── pages/             # Page components, one per route
│   ├── dashboard/
│   ├── lands/
│   ├── projects/
│   ├── ...
├── providers/         # React context providers (Auth, Locale, Notification)
├── services/          # Data layer (createStore, seed data, exports)
├── constants/         # Translations, status colors, etc.
├── types/             # TypeScript type definitions
├── utils/             # Utilities (cn, business logic, exports)
├── lib/               # Format helpers (QAR, dates, etc.)
└── main.tsx           # App entry point
```

## Internationalization

The app is Arabic-first (RTL) with full English translation support. To switch languages at runtime, use the locale toggle in the top header — the choice is persisted to `localStorage`.

Translation keys live in `src/constants/translations.ts` and are accessed via the `useLocale()` hook:

```tsx
import { useLocale } from '@/providers/LocaleContext';

function MyPage() {
  const { t } = useLocale();
  return <h1>{t.lands.title}</h1>;
}
```

## Data Storage

This build uses **localStorage-backed in-memory stores** (`createStore` from `src/services/dataService.ts`). All seed data ships with the app — there's no backend required for a demo or evaluation build.

To reset all data, open the browser console and run:
```js
Object.keys(localStorage).filter(k => k.startsWith('erp_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

## License

Proprietary — all rights reserved.
