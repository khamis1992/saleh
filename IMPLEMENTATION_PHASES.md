# IMPLEMENTATION PHASES — land2 ERP
> Execution roadmap derived from `PENDING_FEATURES.md` (180+ tools master list)
> Updated: June 2, 2026
> Project: `C:\Users\khamis\Documents\land2`

---

## EXECUTIVE STATUS

| Phase | Title | Status | Coverage | Effort |
|---|---|---|---|---|
| **Phase 0** | Already-built foundation | ✅ COMPLETE | n/a | 4 weeks (prior sessions) |
| **Phase 1** | Wire installed packages + Quick wins | ✅ COMPLETE | +10% | 1 day |
| **Phase 2** | Visual power + Geocoding + Photos | ✅ COMPLETE | +5% | 1-2 days |
| **Phase 3** | Customer/Tenant Portals | ❌ NOT STARTED | +8% | 1 week |
| **Phase 4** | Communication & Payment | ❌ NOT STARTED | +7% | 1-2 weeks |
| **Phase 5** | GCC Compliance & E-Invoicing | ✅ COMPLETE | +10% | 2-3 weeks |
| **Phase 6** | Identity & SSO (Nafath/UAE PASS) | ❌ NOT STARTED | +5% | 1-2 weeks |
| **Phase 7** | Enterprise SaaS Integrations | ❌ NOT STARTED | +10% | 3-4 weeks |
| **Phase 8** | BIM / Biometrics / Future | ❌ DEFERRED | +5% | 4+ weeks |

**Total current coverage:** ~40% (up from 35%)
**Remaining work to reach 80%:** ~2-5 months focused dev

---

## PHASE 0 — ALREADY BUILT (FOUNDATION)
**Status:** ✅ COMPLETE in prior sessions
**Coverage:** Foundation of 115 pages, 21 features in "8 WAVES" delivery

### Built in 8 WAVES session
- Executivo Center: scorecards, NOI chart, occupancy heatmap, risk matrix
- Construction: risk register page, EVM panel, Gantt chart
- Property: leasing pipeline CRM (8-stage)
- Finance: 3-way matching
- Maintenance: asset registry with warranty tracking
- Procurement: vendor scorecard with grading
- Shared components: Chart, Drawer, Scorecard, EVMPanel

### Built this session
- 64 unit tests (Vitest + RTL)
- Build fix (Select components import)
- Notification system verified (13 alert categories)

---

## PHASE 1 — WIRE INSTALLED PACKAGES + QUICK WINS
**Status:** ✅ COMPLETE
**Effort:** 1 day (this session)
**Impact:** +10% coverage
**Risk:** LOW

### 1.1 QR Code generation (qrcode) ✅ DONE
- UnitDetailPage — QR tab with print
- EquipmentPage — "Generate QR Labels" + QR column + per-item dialog
- InventoryItemsPage — QR dialog per item (card + table views)
- MaintenanceRequestDetailPage — QR display dialog

### 1.2 QR Code scanning (@yudiel/react-qr-scanner) ✅ DONE
- MaintenanceRequestDetailPage — scan to assign unit/equipment
- WorkOrdersPage — scan to find work order

### 1.3 SignaturePad (in-browser) ✅ DONE
- LeaseDetailPage — new "التوقيع" tab

### 1.4 Testing infrastructure (Vitest + RTL) ✅ DONE
- vitest.config.ts
- src/test/setup.ts with localStorage polyfill
- 64 tests passing across 4 files:
  - format.test.ts (15)
  - business-logic.test.ts (22)
  - vat.test.ts (13)
  - financial-analysis.test.ts (14)

### 1.5 VAT calculations & report ✅ DONE
- src/utils/vat.ts (computeVAT, computeVATBreakdown, formatVATRate, isVATApplicable)
- src/pages/finance/VATReportPage.tsx with 3 tabs
- Route: /finance/vat-report
- Sidebar entry added

### 1.6 Financial analysis (financial package) ✅ DONE
- src/utils/financialAnalysis.ts (IRR, NPV, PMT, FV, PV, ROI, payback, amortization)
- New "التحليل المالي" tab in ProjectDetailPage

### 1.7 Photo upload component ✅ DONE
- src/components/shared/PhotoUpload.tsx
- Wired into MaintenanceRequestDetailPage

### 1.8 Notification system ✅ VERIFIED (already existed)
- 13 alert categories auto-generated every 30s
- Bell icon in Header with dropdown

---

## PHASE 2 — VISUAL POWER + UX POLISH
**Status:** ✅ COMPLETE (this session)
**Effort:** 1-2 days
**Impact:** +5% coverage
**Risk:** LOW

### 2.1 Geocoding in LandCreatePage ✅ DONE
- Nominatim (OpenStreetMap) address search wired in `Geocoder` component
- Auto-fills `gps_lat` / `gps_lng` on result pick
- Extracts municipality from `displayName` when empty
- Imported and used in LandCreatePage

### 2.2 Photo upload on DailyReportsPage ✅ DONE
- `PhotoUpload` component used in DailyReportsPage create/edit dialog
- `photos: string[]` already in `ReportForm`
- Stored as JSON in the row, badge counter shows count

### 2.3 Multi-language support ✅ DONE
- `LocaleContext` has `tt(key, defaultValue)` — current → English → Arabic → defaultValue chain
- Header has working AR/EN toggle that flips `dir` and `lang`
- All major pages use `t.*` from translation dict

### 2.4 Advanced Data Tables ✅ DONE
- TanStack react-table v8 wrapper at `src/components/ui/data-table.tsx`
- Wired into:
  - `pages/rent-collection/RentInvoicesPage.tsx` (sortable, filterable, paginated, CSV export)
  - `pages/leases/LeaseListPage.tsx` (same)
  - `pages/units/UnitListPage.tsx` (same)
- CSV export derives column labels from columnDef.headers (works for string headers)

### 2.5 Document upload (real progress + compression) ✅ DONE
- New `src/utils/fileCompress.ts` — `compressImage()` with maxWidthOrHeight, quality, mimeType
- New `src/components/shared/FileUpload.tsx` — multi-file dropzone with **per-file progress bars**, compression, savings summary
- New `src/components/shared/PhotoUpload.tsx` upgraded — same progress + compression features, image-only
- DocumentsPage now uses `FileUpload` (5 files max, 10MB each, auto-compress images)
- `src/test/fileCompress.test.ts` — 4 new tests for `formatBytes` and passthrough
- Total tests: 90 (up from 86)
- DocumentsPage reports "saved X bytes through compression" on successful upload

---

## PHASE 3 — CUSTOMER PORTAL
**Status:** ✅ COMPLETE (June 2026)
**Effort:** 1 day
**Impact:** +8% coverage
**Risk:** MEDIUM (architectural change)

Built 3 external portals (Tenant, Landlord, Vendor) with separate auth, top-nav layout, and 24 functional pages. All lookups are against existing localStorage stores (skip Supabase per project convention).

### 3.1 Tenant Portal ✅ DONE (10 pages)
- Authentication: email + tenant_code
- Dashboard: lease summary, balance, due date, overdue alert
- My Lease: full read-only contract terms + unit + tenant details
- My Invoices: status pills, balance, PDF download, pay CTA
- Pay Rent: 5-step flow (select invoice → method → confirm → processing → success) with HyperPay/Moyasar/Tap/Apple Pay simulation. Real payment gateway integration is deferred per project convention.
- Payment History: receipt list with method icons
- Maintenance Requests: 12-category submit form + photo upload + status tracking + cancellation
- Documents: synthesized from real records (lease, receipts, ID copy)
- Profile: view + edit personal/contact/emergency info
- Inspections: move-in/move-out with checklist + SignaturePad signing
- Notices: renewal request + vacate notice + system notifications

### 3.2 Landlord Portal ✅ DONE (8 pages)
- Portfolio overview: KPIs, performance bar chart, expiring leases, properties grid
- Property Performance: NOI, ROI, cap rate per property
- Tenant Directory: contact + lease + balance per tenant
- Renewal Pipeline: expiring contracts (30/60/90 day buckets), renew/reject actions
- Maintenance Cost: pie chart by category + bar chart by property
- Financial Reports: invoiced, collected, receivables, collection rate
- Documents Archive: title deeds + contracts (synthesized)
- Messages: 2-panel chat (landlord ↔ tenant) with auto-reply simulation (localStorage)

### 3.3 Vendor Portal ✅ DONE (6 pages)
- Dashboard: rating, claims stats, quick actions, recent claims
- Active Contracts: progress bar, advance/retention breakdown
- Quotations: submit new quote for RFQ (localStorage)
- Progress Claims: 3-stage approval workflow (engineer → PM → finance) with net calculation
- Payment Status: bank info + paid/pending breakdown
- Compliance: CR/tax/insurance/safety docs with expiry tracking

### 3.4 Marketing listing integration ❌ DEFERRED
- Property Finder / Bayut / Aqar APIs require backend + contracts. Deferred to Phase 7 (SaaS Integrations).

---

## PHASE 4 — COMMUNICATION & PAYMENT
**Status:** ❌ NOT STARTED
**Effort:** 1-2 weeks
**Impact:** +7% coverage
**Risk:** MEDIUM (need backend for real)

### 4.1 Payment Gateway UI (stubs first)
- HyperPay integration (MENA leader, Mada/Apple Pay/cards)
- Moyasar (Saudi)
- PayTabs
- Tap Payments
- Build the UI; backend wiring deferred
- Webhook handlers stub

### 4.2 SMS Notifications
- Unifonic (MENA, Arabic, high deliverability) — TOP CHOICE
- Twilio (global backup)
- Msegat (Saudi)
- CEQUENS
- Trigger events: lease signed, rent invoice, overdue reminder, maintenance update

### 4.3 Email Notifications
- Resend (modern, React Email) — TOP CHOICE
- SendGrid (enterprise)
- Mailgun
- Templates for: invoice, receipt, overdue, contract renewal

### 4.4 Push Notifications
- OneSignal (web push, free)
- Firebase Cloud Messaging
- WhatsApp Business API (MENA preferred)

### 4.5 E-Signature API
- DocuSign (gold standard)
- Zoho Sign (MENA, Arabic)
- PandaDoc
- Adobe Sign

---

## PHASE 5 — GCC COMPLIANCE & E-INVOICING
**Status:** ✅ COMPLETE (June 2, 2026)
**Effort:** 1 day (this session)
**Impact:** +10% coverage
**Risk:** HIGH (regulatory, requires legal review — demo-grade only)

### 5.1 ZATCA E-Invoicing (Saudi Arabia) ✅ DONE
- `src/utils/zatca.ts` — TLV QR generation (5 tags, base64-url), hash chain (SHA-256), UBL 2.1 XML, CSID lifecycle, 10 compliance checks, Arabic labels
- `src/pages/finance/ZATCAInvoicePage.tsx` — full CRUD page: KPI strip, filtered table, create dialog with line items, detail dialog (overview/lines/XML/QR), CSID management tab, hash chain visualization, compliance checks tab, simulate clearance workflow
- Store: `erp_zatca_invoices` + `erp_zatca_csids` (4 seed invoices + 2 CSIDs)
- `src/test/zatca.test.ts` — 15 tests (QR, hash chain, totals, numbering, labels, compliance, XML gen)

### 5.2 UAE Corporate Tax (9%) ✅ DONE
- `src/utils/uaeCorporateTax.ts` — computeCorporateTax (mainland/QFZP/natural person, SBR threshold, 9% rate), EmaraTax payload builder, filing deadline, period labels, readiness checks, ledger aggregation
- `src/pages/finance/UaeCorporateTaxPage.tsx` — period management (create, edit revenue/expenses, compute, submit to FTA, confirm payment), KPI cards, detailed tax computation panel
- Store: `erp_uae_ct_periods` + `erp_uae_ct_ledger` (3 fiscal year periods)

### 5.3 GCC VAT Returns ✅ DONE
- `src/pages/finance/GccVatReturnFilingPage.tsx` — VAT return filing for AE/SA/BH/OM, output/input VAT, reverse charge, import VAT, correction amounts, submit to FTA workflow
- Store: `erp_gcc_vat_returns` (3 quarterly returns)

### 5.4 Wage Protection System (WPS) — UAE ✅ DONE
- `src/utils/wps.ts` — SIF file generation (header + employee rows, pipe-delimited), validation (IBAN, labour ID), UAE bank codes, salary date computation
- `src/pages/hr/WpsPage.tsx` — file list, employee roster, generate new WPS file, preview SIF content in dialog, submit to MOHRE
- Store: `erp_wps_files` + `erp_wps_salary_items` (2 files, 3 employees)

### 5.5 GOSI (Saudi Social Insurance) ✅ DONE
- `src/utils/gosi.ts` — calculateGosi (Saudi 18% / non-Saudi 2%, capped at 9,000 SAR), filing totals, XML submission builder
- `src/pages/hr/GosiPage.tsx` — monthly filings list, subscriber roster with contribution details, generate/submit to GOSI Online
- Store: `erp_gosi_filings` + `erp_gosi_contributions` (2 filings, 3 subscribers)
- `src/test/gosi.test.ts` — 7 tests (Saudi/non-Saudi calculation, totals, period labels, config)

### 5.6 Other Regulatory ✅ DONE
- `src/utils/regulatory.ts` — 9 authorities (Ejari, DLD, RERA, Baladi, MOMRA, DubaiMunicipality, MOHRE, GAZT, QatarRA), expiry checks, registration types per authority, renewal date computation
- `src/pages/legal/RegulatoryPage.tsx` — filtered table by authority, create dialog, expiry warnings (30-day color coding), KPI cards (total/expiring/expired/fees)
- Store: `erp_regulatory_registrations` (8 seed registrations)

### Navigation
- New **"الامتثال والتنظيم"** work center in Sidebar (7th center, violet-fuchsia gradient)
- 6 routes under `/compliance/*` in App.tsx

---

## PHASE 6 — IDENTITY & SSO
**Status:** ❌ NOT STARTED
**Effort:** 1-2 weeks
**Impact:** +5% coverage
**Risk:** MEDIUM (requires real auth backend)

### 6.1 National Digital Identity
- Nafath / Absher (Saudi — 20M+ users) — HIGH for Saudi
- UAE PASS (UAE government) — HIGH for UAE
- Kuwait Mobile ID
- TurkID (Oman)

### 6.2 Enterprise SSO
- Clerk (React SDK with MFA)
- Auth0 (Okta — enterprise)
- Keycloak (self-hosted)

### 6.3 Supabase Auth (current stack)
- Currently using localStorage (fake)
- Wire up real Supabase Auth
- Migrate demo users to real auth
- Add row-level security
- **Note:** User said "skip Supabase for now" — keep localStorage

---

## PHASE 7 — ENTERPRISE SAAS INTEGRATIONS
**Status:** ❌ NOT STARTED
**Effort:** 3-4 weeks
**Impact:** +10% coverage
**Risk:** HIGH (all need backend + contracts)

### 7.1 Property Management SaaS
- AppFolio API
- Buildium API
- Yardi Voyager
- MRI Software
- Entrata
- DoorLoop

### 7.2 Construction SaaS
- Procore API
- Autodesk Construction Cloud
- Bluebeam
- Fieldwire
- PlanRadar
- Aconex (Oracle)

### 7.3 Accounting APIs
- QuickBooks Online
- Xero
- Zoho Books (MENA + UAE VAT)
- Wafeq (UAE/Saudi, Arabic UI)
- Daftra (Egyptian/Saudi)
- Sage Intacct
- NetSuite

### 7.4 Procurement SaaS
- SAP Ariba
- Coupa
- Oracle Procurement Cloud
- Tradeling (MENA B2B)
- Tejari (Dubai government)

### 7.5 Maintenance CMMS
- Fiix
- UpKeep
- MaintainX
- Limble CMMS
- Maximo (IBM)

### 7.6 HR / Payroll
- ZenHR (MENA, Arabic) — TOP CHOICE
- Bayzat (UAE)
- Jisr (Saudi)
- MenaHR
- BambooHR

### 7.7 BI & Reporting
- Metabase (open source)
- Apache Superset (open source)
- Grafana
- Power BI Embedded
- Tableau Embedded

### 7.8 Document Management
- Box API
- Google Drive API
- Microsoft OneDrive / SharePoint
- Dropbox Sign

---

## PHASE 8 — FUTURE / SPECIALIZED
**Status:** ❌ DEFERRED
**Effort:** 4+ weeks
**Impact:** +5% coverage
**Risk:** HIGH (specialized, niche)

### 8.1 BIM / 3D Modeling
- web-ifc for browser IFC loading
- @xeokit/xeokit-bim-viewer
- Three.js for general 3D
- Autodesk Forge / APS API
- Bentley iTwin.js

### 8.2 Biometric Attendance
- zkteco-js for fingerprint devices
- Connect ZK hardware
- Real-time attendance feed
- Overtime calculation

### 8.3 Advanced Mapping
- Mapbox GL JS (vector maps)
- Google Maps Platform
- ESRI / ArcGIS
- TomTom Maps
- What3Words (3-word addresses)

### 8.4 Document AI / OCR
- tesseract.js (in-browser OCR)
- Adobe PDF Services
- Docparser

### 8.5 Open Source ERP Integration (study)
- ERPNext real estate module
- Odoo construction module
- Crater (invoicing)

### 8.6 Research Data Sources
- World Bank Open Data
- IMF Data
- Trading Economics API
- Numbeo API

### 8.7 Blockchain / Web3
- @parcl-finance/product-sdk (real estate on Solana)
- NFT-based property titles

---

## EXECUTION ROADMAP (RECOMMENDED ORDER)

### 🔴 IMMEDIATE (this week)
- [x] Phase 1: Wire installed packages
- [x] Phase 2.1: Geocoding in LandCreatePage
- [x] Phase 2.2: Photo upload on DailyReportsPage
- [x] Phase 2.3: Multi-language (already works via `tt()` fallback chain)
- [x] Phase 2.4: Advanced Data Tables (wired into invoices, leases, units)
- [x] Phase 2.5: Document upload with progress + compression

### 🟠 NEXT 2 WEEKS
- [ ] Phase 3.1: Tenant Portal (read-only MVP)
- [ ] Phase 2.4: Advanced Data Tables
- [ ] Phase 2.5: Document upload

### 🟡 NEXT MONTH
- [ ] Phase 4.1: Payment Gateway UI
- [ ] Phase 4.2: SMS via Unifonic
- [ ] Phase 4.3: Email via Resend
- [ ] Phase 3.2: Landlord Portal
- [ ] Phase 3.3: Vendor Portal

### 🟢 NEXT QUARTER
- [ ] Phase 5.1: ZATCA E-Invoicing (if Saudi)
- [ ] Phase 5.2: UAE Corporate Tax
- [ ] Phase 5.3: VAT Framework (complete)
- [ ] Phase 6.1: National ID (Nafath/UAE PASS)
- [ ] Phase 7: First enterprise SaaS (start with Procore + QuickBooks)

### ⏸️ DEFERRED (until 80%+ coverage reached)
- Phase 8: BIM, biometrics, blockchain

---

## EFFORT & DEPENDENCY MATRIX

| Phase | Days | People | Depends On |
|---|---|---|---|
| 1 | 1 | 1 | Nothing — done |
| 2 | 2 | 1 | Nothing |
| 3 | 7 | 2 | Auth backend (or localStorage) |
| 4 | 14 | 2 | Backend (real SMS/email/payment) |
| 5 | 21 | 2 | Backend + legal review |
| 6 | 14 | 1 | Auth backend |
| 7 | 30 | 3 | Backend + SaaS contracts |
| 8 | 30+ | 3 | Specialized hardware/contracts |

**Total to 80% coverage:** ~120 working days (2-3 engineers × 3 months)
**Total to 100% coverage:** ~240+ days (6+ months)

---

## DECISION FRAMEWORK

Before starting a phase, ask:
1. Is there a business case? (will this generate revenue or save time?)
2. Is there a regulatory requirement? (ZATCA, VAT, etc.)
3. Is the user demand there? (do users ask for this?)
4. Is the data available? (do we have it in localStorage stores?)
5. Is the backend required? (if yes, do we have one?)

If 1+2+3 are YES → HIGH priority
If only 4 is YES → MEDIUM priority
If only 5 is YES → DEFERRED

---

## STATUS TRACKING

To update this file:
- Mark completed items with ✅ DONE
- Update coverage % in the Executive Status table
- Add new discoveries to relevant phase
- Move deferred items to Phase 8 with rationale

---

## RELATED FILES

- `C:\Users\khamis\Documents\land2\TOOLS_AND_SKILLS_MASTER_LIST.md` — source master list
- `C:\Users\khamis\Documents\land2\PENDING_FEATURES.md` — feature gap analysis
- `C:\Users\khamis\Documents\land2\.hermes\plans\2026-06-01-feature-implementation-plan.md` — earlier plan
- `C:\Users\khamis\Documents\land2\package.json` — installed dependencies
- `C:\Users\khamis\Documents\land2\src\pages\` — 115 page files

---

## SUMMARY
## SUMMARY
- ✅ Phase 0: Foundation built
- ✅ Phase 1: Quick wins DONE
- ✅ Phase 2: Visual power DONE (this session)
- ❌ Phase 3-8: 0% done
- Current: 40% of 180-feature master list
- Target: 80% within 3-6 months focused work
