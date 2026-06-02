# PENDING FEATURES — land2 ERP
> Master gap analysis against `TOOLS_AND_SKILLS_MASTER_LIST.md` (180+ tools)
> Generated: June 2, 2026
> Project: `C:\Users\khamis\Documents\land2`

---

## EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total tools/integrations in master list | **~180+** |
| npm packages in master list | **65+** |
| npm packages INSTALLED | **25** |
| npm packages PENDING | **40+** |
| MENA/GCC specific tools | **30+** |
| MENA/GCC tools PENDING | **30+** (all) |
| SaaS APIs & Platforms PENDING | **80+** (all — need backend) |
| Pages built (current) | **115** |
| GCC compliance items PENDING | **10** (all) |
| Build status | PASSING (3,783 modules, 0 errors) |
| Tech stack | React 19 + TypeScript + Vite 8 + Tailwind 4 + ShadCN |

**Coverage to date:** ~12% of master list (21 features delivered in "8 WAVES" session, 25 npm packages installed).

---

## SECTION 1 — REAL ESTATE & PROPERTY MANAGEMENT

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `@use_homi/real-estate-portal-schemas` | ❌ PENDING | Zod schemas for Zillow/Airbnb/Rightmove — N/A for local Qatar ops |
| `@mandaitor/taxonomy-realestate` | ❌ PENDING | AI taxonomy — not needed |
| `o-waw-agent-tools` | ❌ PENDING | Bangkok-only — skip |
| `@parcl-finance/product-sdk` | ❌ PENDING | Solana blockchain — out of scope |

### SaaS APIs & Platforms (all need backend)
| Tool | Status | Priority |
|---|---|---|
| AppFolio API | ❌ PENDING | DEFERRED — enterprise external |
| Buildium API | ❌ PENDING | DEFERRED — external |
| Yardi Voyager | ❌ PENDING | DEFERRED — enterprise competitor |
| MRI Software | ❌ PENDING | DEFERRED — enterprise competitor |
| Entrata | ❌ PENDING | DEFERRED |
| ResMan | ❌ PENDING | DEFERRED |
| Propertyware | ❌ PENDING | DEFERRED |
| DoorLoop | ❌ PENDING | DEFERRED |
| Hemlane | ❌ PENDING | DEFERRED |
| TenantCloud | ❌ PENDING | DEFERRED |
| Avail | ❌ PENDING | DEFERRED |
| TurboTenant | ❌ PENDING | DEFERRED |

### MENA / GCC Property Portals
| Tool | Status | Priority |
|---|---|---|
| Property Finder API (UAE) | ❌ PENDING | LOW — no UAE presence yet |
| Bayut API (UAE) | ❌ PENDING | LOW |
| Aqar API (Saudi) | ❌ PENDING | LOW |
| Sakani API (Saudi) | ❌ PENDING | LOW |
| Ejari API (Dubai) | ❌ PENDING | LOW |
| DARI API (Abu Dhabi) | ❌ PENDING | LOW |
| RERA API (Dubai) | ❌ PENDING | LOW |
| Mulkia API (Saudi) | ❌ PENDING | LOW |

---

## SECTION 2 — CONSTRUCTION PROJECT MANAGEMENT

### Gantt / Scheduling npm Packages
| Package | Status | Notes |
|---|---|---|
| `frappe-gantt` | ✅ INSTALLED | ❌ NOT WIRED in any page |
| `gantt-task-react` | ❌ PENDING | TS alternative, not needed if frappe works |
| `@svar-ui/react-gantt` | ❌ PENDING | Not needed |
| `@syncfusion/ej2-react-gantt` | ❌ PENDING | Commercial |
| `devexpress-gantt` | ❌ PENDING | Commercial |
| `gantt-schedule-timeline-calendar` | ❌ PENDING | Framework-agnostic |
| `dhtmlx-gantt` | ❌ PENDING | GPL |
| `construction-gantt` | ❌ PENDING | New, low downloads |
| `@progress/kendo-react-gantt` | ❌ PENDING | Commercial |
| `@visactor/vtable-gantt` | ❌ PENDING | Canvas-based |

**🔥 ACTION ITEM:** Wire `frappe-gantt` into ProjectDetailPage timeline tab. Package is installed but not used.

### Construction SaaS APIs (all need backend)
| Tool | Status |
|---|---|
| Procore API | ❌ PENDING (DEFERRED) |
| Autodesk Construction Cloud | ❌ PENDING (DEFERRED) |
| Bluebeam | ❌ PENDING (DEFERRED) |
| Buildertrend | ❌ PENDING (DEFERRED) |
| CoConstruct | ❌ PENDING (DEFERRED) |
| Fieldwire | ❌ PENDING (DEFERRED) |
| PlanRadar | ❌ PENDING (DEFERRED) |
| Briq | ❌ PENDING (DEFERRED) |
| Aconex (Oracle) | ❌ PENDING (DEFERRED) |

---

## SECTION 3 — FINANCIAL & ACCOUNTING

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `accounting-js` | ❌ REMOVED | Using Intl.NumberFormat instead — OK |
| `accounting` | ❌ PENDING | Old classic — not needed |
| `financial` | ✅ INSTALLED | ❌ NOT WIRED anywhere |
| `xero-node` | ❌ PENDING | External API |
| `@railzai/railz-connect` | ❌ PENDING | External API |
| `@mergeapi/merge-sdk-typescript` | ❌ PENDING | External API |
| `@pipedream/quickbooks` | ❌ PENDING | External API |
| `bc3` | ❌ PENDING | Spanish construction budget format — N/A |

**🔥 ACTION ITEM:** Wire `financial` (IRR, NPV, PMT, FV) into ProjectDetailPage financial tab and LandDetailPage investment analysis.

### Payment Gateways (GCC/MENA — all need backend)
| Gateway | Status | Priority |
|---|---|---|
| HyperPay | ❌ PENDING | HIGH when backend ready |
| Moyasar | ❌ PENDING | HIGH when backend ready |
| PayTabs | ❌ PENDING | MEDIUM |
| Checkout.com | ❌ PENDING | MEDIUM |
| Tap Payments | ❌ PENDING | MEDIUM |
| 2Checkout | ❌ PENDING | LOW |
| Stripe | ❌ PENDING | LOW (limited GCC) |
| Amazon Payment Services | ❌ PENDING | MEDIUM |
| Telr | ❌ PENDING | LOW |
| CASHU | ❌ PENDING | LOW |
| Fawry | ❌ PENDING | LOW |
| Fatoora / ZATCA | ❌ PENDING | HIGH for Saudi ops |

### Accounting APIs (all need backend)
| Tool | Status |
|---|---|
| QuickBooks Online API | ❌ PENDING (DEFERRED) |
| Xero API | ❌ PENDING (DEFERRED) |
| Zoho Books API | ❌ PENDING (DEFERRED) |
| Sage Intacct API | ❌ PENDING (DEFERRED) |
| NetSuite (Oracle) API | ❌ PENDING (DEFERRED) |
| FreshBooks API | ❌ PENDING (DEFERRED) |
| Wave API | ❌ PENDING (DEFERRED) |
| Wafeq | ❌ PENDING (DEFERRED — top GCC choice) |
| Daftra | ❌ PENDING (DEFERRED) |
| ERPNext (open source) | ❌ PENDING (study only) |

### VAT / Tax Compliance
| Tool | Status | Priority |
|---|---|---|
| ZATCA E-Invoicing (Fatoora) | ❌ PENDING | HIGH for Saudi |
| UAE FTA VAT API | ❌ PENDING | HIGH for UAE |
| Qatar GTA API | ❌ PENDING | HIGH for Qatar |
| Avalara | ❌ PENDING | MEDIUM |
| TaxJar | ❌ PENDING | LOW (US) |
| Vertex | ❌ PENDING | LOW |

---

## SECTION 4 — MAPS, GIS & GEOSPATIAL

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `leaflet` | ✅ INSTALLED | ✅ WIRED in LandMap |
| `@turf/turf` | ✅ INSTALLED | ✅ WIRED in LandMap (distance from Doha) |
| `esri-leaflet` | ❌ PENDING | N/A — using OSM |
| `leaflet-geosearch` | ❌ PENDING | Address lookup — could be useful |
| `leaflet-control-geocoder` | ❌ PENDING | Alternative geocoder |
| `@maptiler/geocoding-control` | ❌ PENDING | N/A |
| `@takram/three-geospatial` | ❌ PENDING | 3D — overkill |
| `@math.gl/geospatial` | ❌ PENDING | N/A |

**🔥 ACTION ITEM:** Add geocoding (search by place name) to LandCreatePage. Currently no address lookup.

### GIS / Mapping APIs
| Service | Status | Notes |
|---|---|---|
| Google Maps Platform | ❌ PENDING | Pay-per-use |
| Mapbox GL JS | ❌ PENDING | Better than Leaflet but paid |
| OpenStreetMap | ✅ USING | Free tiles via Leaflet |
| MapTiler | ❌ PENDING | Alternative tile source |
| HERE Maps | ❌ PENDING | Enterprise |
| ESRI / ArcGIS | ❌ PENDING | Enterprise |
| TomTom | ❌ PENDING | Enterprise |
| What3Words | ❌ PENDING | Useful for site locations |
| GeoCerts / GeoLib | ❌ PENDING | MENA geo-boundary data |

---

## SECTION 5 — DOCUMENT MANAGEMENT & PDF

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `pdf-lib` | ✅ INSTALLED | ❌ NOT WIRED |
| `pdfkit` | ❌ PENDING | Node.js — not for browser |
| `@adobe/pdfservices-node-sdk` | ❌ PENDING | Server-side only |
| `officeparser` | ✅ INSTALLED | ✅ WIRED in DocumentsPage |
| `@signpdf/signpdf` | ❌ PENDING | Server-side only |
| `jspdf` | ✅ INSTALLED | ✅ WIRED in exportUtils.ts |
| `react-pdf` | ❌ PENDING | Not installed |
| `tesseract.js` | ❌ PENDING | OCR for scanned docs — heavy |
| `mammoth` | ✅ INSTALLED | ✅ WIRED in DocumentsPage |
| `jszip` | ✅ INSTALLED | ❌ NOT WIRED |

**🔥 ACTION ITEMS:**
- Wire `pdf-lib` for advanced PDF manipulation (currently only jspdf is used)
- Wire `jszip` for "download all documents as ZIP" feature
- Add `react-pdf` for React-based PDF generation
- Add `tesseract.js` for OCR on uploaded images

### Document SaaS APIs
| Tool | Status |
|---|---|
| DocuSign API | ❌ PENDING (DEFERRED) |
| Adobe Sign API | ❌ PENDING (DEFERRED) |
| PandaDoc API | ❌ PENDING (DEFERRED) |
| Dropbox Sign (HelloSign) | ❌ PENDING (DEFERRED) |
| Box API | ❌ PENDING (DEFERRED) |
| Google Drive API | ❌ PENDING (DEFERRED) |
| Microsoft OneDrive / SharePoint | ❌ PENDING (DEFERRED) |
| Zoho Sign | ❌ PENDING (DEFERRED — top MENA choice) |
| Yousign | ❌ PENDING (DEFERRED) |

---

## SECTION 6 — BIM & 3D MODELING

### npm Packages (all PENDING)
| Package | Status | Priority |
|---|---|---|
| `web-ifc` | ❌ PENDING | LOW — niche |
| `@xeokit/xeokit-sdk` | ❌ PENDING | LOW |
| `@xeokit/xeokit-bim-viewer` | ❌ PENDING | LOW |
| `@thatopen/ui` | ❌ PENDING | LOW |
| `online-3d-viewer` | ❌ PENDING | LOW |
| `@itwin/core-quantity` | ❌ PENDING | LOW |
| `three.js` | ❌ PENDING | LOW (general 3D) |

**🎯 DECISION:** Defer all BIM features — too specialized for current scope.

### BIM APIs (all PENDING — DEFERRED)
Autodesk Forge / APS, Bentley iTwin.js, BIMServer, IfcOpenShell, Speckle, BIMCollab, SimpleBIM

---

## SECTION 7 — PROCUREMENT & SUPPLY CHAIN

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `@railzai/railz-connect` | ❌ PENDING | External API |
| `n8n-nodes-erpnext-buying` | ❌ PENDING | n8n workflow |

### Procurement SaaS (all PENDING — DEFERRED)
SAP Ariba, Coupa, Oracle Procurement Cloud, Procurify, Precoro, Tradeling, Tejari, ARYAF

---

## SECTION 8 — MAINTENANCE MANAGEMENT (CMMS)

### SaaS APIs (all PENDING — DEFERRED)
| Tool | Status | Notes |
|---|---|---|
| Fiix | ❌ PENDING | Could integrate when backend ready |
| UpKeep | ❌ PENDING | |
| MaintainX | ❌ PENDING | |
| Limble CMMS | ❌ PENDING | Has QR scanning — useful |
| Fracttal | ❌ PENDING | IoT/predictive |
| eMaint | ❌ PENDING | |
| Maximo (IBM) | ❌ PENDING | |
| Corrigo | ❌ PENDING | |

**Note:** Internal AssetRegistryPage already provides similar functionality.

---

## SECTION 9 — HR & WORKFORCE MANAGEMENT

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `@easyteam/ui` | ❌ PENDING | React Native only |
| `@easyteam/launcher` | ❌ PENDING | iframe embed |
| `zkteco-js` | ❌ PENDING | Fingerprint device |
| `@egovernments/digit-ui-module-hrms` | ❌ PENDING | Government module |

**🎯 DECISION:** Defer all biometric/device integrations.

### HR / Payroll SaaS (all PENDING — DEFERRED)
BambooHR, Gusto, Deel, Remote.com, ZenHR (top MENA choice), Jisr, MenaHR, Bayzat, MenaITech

**Note:** Internal pages (EmployeesPage, PayrollPage, AttendancePage, LeaveManagementPage) cover core HR locally.

---

## SECTION 10 — FORMS, WORKFLOWS & APPROVALS

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `react-hook-form` | ✅ INSTALLED | ✅ USED across pages |
| `survey-creator-react` | ✅ INSTALLED | ✅ WIRED in InspectionBuilderPage |
| `@payloadcms/plugin-form-builder` | ❌ PENDING | CMS integration |
| `zod` | ✅ INSTALLED | ✅ USED with RHF |
| `react-query` (TanStack Query) | ❌ PENDING | Will need when Supabase is wired |

### Workflow / BPM Platforms (all PENDING — DEFERRED)
n8n, Camunda, Temporal, Zeebe, Kissflow, ProcessMaker, Joget

---

## SECTION 11 — REPORTING, ANALYTICS & BI

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `powerbi-client-react` | ❌ PENDING | External BI |
| `recharts` | ✅ INSTALLED | ✅ USED in dashboard |
| `@nivo/core` | ❌ PENDING | Alternative to recharts |
| `ag-charts-react` | ❌ PENDING | Commercial |
| `echarts-for-react` | ✅ INSTALLED | ✅ USED in new chart components |
| `@tremor/react` | ❌ PENDING | Tailwind dashboard components |

### BI & Reporting Platforms (all PENDING — DEFERRED)
Metabase, Apache Superset, Grafana, Power BI Embedded, Tableau Embedded, Looker Embedded, Slemma

---

## SECTION 12 — NOTIFICATIONS & COMMUNICATION

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `expo-notifications` | ❌ PENDING | React Native only |
| `mailosaur` | ❌ PENDING | Email/SMS testing |

### Notification & Messaging APIs (all PENDING — DEFERRED)
| Tool | Status | Priority |
|---|---|---|
| Twilio | ❌ PENDING | HIGH when backend ready |
| SendGrid | ❌ PENDING | MEDIUM |
| Mailgun | ❌ PENDING | LOW |
| Resend | ❌ PENDING | MEDIUM (modern API) |
| OneSignal | ❌ PENDING | MEDIUM |
| Firebase Cloud Messaging | ❌ PENDING | MEDIUM (free) |
| WhatsApp Business API | ❌ PENDING | MEDIUM |
| Unifonic | ❌ PENDING | HIGH for MENA |
| Msegat | ❌ PENDING | MEDIUM for Saudi |
| CEQUENS | ❌ PENDING | LOW |
| Infobip | ❌ PENDING | MEDIUM |
| 4jawaly | ❌ PENDING | LOW |
| Slack API | ❌ PENDING | LOW |
| Telegram/Discord | ❌ PENDING | LOW |

**🔥 ACTION ITEM:** Add in-app notification center (NotificationBell already in header but not wired to events).

---

## SECTION 13 — QR CODES, BARCODES & ASSET TRACKING

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `qrcode` | ✅ INSTALLED | ❌ NOT WIRED in any page |
| `@yudiel/react-qr-scanner` | ✅ INSTALLED | ❌ NOT WIRED |
| `@zxing/library` | ❌ PENDING | Barcode processing |
| `react-qr-barcode-scanner` | ❌ PENDING | Webcam scanner |

**🔥 ACTION ITEMS:**
- Wire `qrcode` for QR code generation on UnitDetailPage, EquipmentPage, InventoryItemsPage
- Wire `@yudiel/react-qr-scanner` for "scan to view" workflow on MaintenanceRequestDetailPage

---

## SECTION 14 — SCHEDULING & CALENDAR

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `@fullcalendar/resource-timeline` | ❌ PENDING | Premium |
| `@fullcalendar/resource` | ❌ PENDING | Premium |
| `@fullcalendar/resource-timegrid` | ❌ PENDING | Premium |
| `@fullcalendar/resource-daygrid` | ❌ PENDING | Premium |
| `@daypilot/daypilot-lite-react` | ✅ INSTALLED | ✅ WIRED in CalendarPage |

---

## SECTION 15 — DIGITAL SIGNATURES & E-SIGNS

### npm Packages
| Package | Status | Notes |
|---|---|---|
| `@signpdf/signpdf` | ❌ PENDING | Server-side only |
| `node-forge` | ❌ PENDING | Cryptographic PKI |

**🔥 ACTION ITEM:** Build a client-side signature pad (HTML5 canvas) — not in master list but needed for lease contracts.

### E-Signature APIs (all PENDING — DEFERRED)
DocuSign, Adobe Sign, PandaDoc, Dropbox Sign, Yousign, SignRequest

---

## SECTION 16 — CUSTOMER PORTAL & SELF-SERVICE

### Tools (all PENDING — DEFERRED for now)
Retool, Appsmith, Budibase, ToolJet, Plasmic, Vercel/Netlify

**Note:** Tenant portal (read-only access) is mentioned in plan as Phase 5.

---

## SECTION 17 — IDENTITY, AUTH & SSO

### Tools
| Tool | Status | Notes |
|---|---|---|
| Clerk | ❌ PENDING | Alternative auth |
| Auth0 (Okta) | ❌ PENDING | Enterprise |
| Supabase Auth | ✅ INSTALLED (not wired) | Current stack choice |
| Firebase Auth | ❌ PENDING | Alternative |
| Keycloak | ❌ PENDING | Self-hosted SSO |
| Nafath / Absher | ❌ PENDING | HIGH for Saudi |
| UAE PASS | ❌ PENDING | HIGH for UAE |
| Kuwait Mobile ID | ❌ PENDING | LOW |
| TurkID (Oman) | ❌ PENDING | LOW |

**Note:** Currently using localStorage demo auth. No real auth wired.

---

## SECTION 18 — FILE STORAGE & CDN

### Services
| Service | Status | Notes |
|---|---|---|
| Supabase Storage | ❌ PENDING (configured, not used) | Current stack |
| AWS S3 | ❌ PENDING | |
| Cloudflare R2 | ❌ PENDING | |
| Wasabi | ❌ PENDING | |
| Backblaze B2 | ❌ PENDING | |
| DigitalOcean Spaces | ❌ PENDING | |

**Note:** Currently using localStorage for files. Real file storage deferred.

---

## SECTION 19 — OPEN SOURCE ERP (REFERENCE)

All PENDING (study only):
- ERPNext (Frappe) — best reference for real estate module
- Odoo Community
- Dolibarr
- LedgerSMB
- iDempiere
- Tryton
- Apache OFBiz
- Metasfresh
- Crater

---

## SECTION 20 — DEVELOPER TOOLS & UTILITIES

### Already in Project ✅
- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 + ShadCN UI
- React Router v7, Recharts, React Hook Form + Zod
- Lucide React icons
- date-fns
- sonner
- @tanstack/react-table
- react-dropzone
- @dnd-kit/core, sortable, utilities
- react-error-boundary
- @hookform/resolvers

### Recommended Additions — Status
| Package | Status | Notes |
|---|---|---|
| `i18next` + `react-i18next` | ❌ PENDING | Custom locale provider works for now |
| `zustand` | ❌ PENDING | Custom createStore works |
| ~~`tanstack/react-table`~~ | ✅ DONE | |
| ~~`react-dropzone`~~ | ✅ DONE | |
| ~~`react-beautiful-dnd` / `@dnd-kit/core`~~ | ✅ DONE (using @dnd-kit) | |
| ~~`react-hot-toast` / `sonner`~~ | ✅ DONE (using sonner) | |
| `swr` / `@tanstack/react-query` | ❌ PENDING | Need for Supabase wiring |
| ~~`react-error-boundary`~~ | ✅ DONE | |
| `vitest` + `@testing-library/react` | ❌ PENDING | **CRITICAL — no tests yet** |
| `playwright` | ❌ PENDING | **CRITICAL — no E2E tests** |

**🔥 ACTION ITEMS:**
- **HIGH:** Add Vitest + React Testing Library for unit tests
- **HIGH:** Add Playwright for E2E tests
- MEDIUM: Consider SWR or TanStack Query for data caching

---

## SECTION 21 — MENA/GCC REGULATORY & COMPLIANCE

### All PENDING — DEFERRED
| Item | Status | Priority |
|---|---|---|
| ZATCA E-Invoicing (Fatoora) | ❌ PENDING | HIGH for Saudi |
| UAE Corporate Tax (9%) | ❌ PENDING | HIGH for UAE |
| GCC VAT Framework (5%, KSA 15%) | ❌ PENDING | HIGH for KSA |
| Wage Protection System (WPS) UAE | ❌ PENDING | HIGH for UAE |
| GOSI (Saudi social insurance) | ❌ PENDING | HIGH for Saudi |
| Baladi / MOMRA (Saudi permits) | ❌ PENDING | MEDIUM |
| Dubai Municipality API | ❌ PENDING | MEDIUM |
| Ejari (Dubai tenancy) | ❌ PENDING | MEDIUM |
| DLD (Dubai Land Department) | ❌ PENDING | MEDIUM |
| RERA | ❌ PENDING | MEDIUM |

**Note:** Current ERP doesn't enforce any country-specific tax rules. All amounts in QAR.

---

## SECTION 22 — RESEARCH DATA SOURCES

### All PENDING (DEFERRED)
World Bank, IMF, Trading Economics, Numbeo, OSM Overpass, Google Earth Engine, NASA SEDAC

---

## PENDING FEATURES BY WORK CENTER

### 🏢 Executivo Center
- ❌ Real-time KPI streaming
- ❌ Customizable dashboard widgets
- ❌ Scheduled PDF reports (daily/weekly)
- ❌ Email digest of KPIs
- ❌ Multi-entity consolidation

### 🏗️ Construction Center
- ❌ **Gantt chart on ProjectDetailPage** (frappe-gantt installed, not wired)
- ❌ Critical path analysis
- ❌ Resource leveling
- ❌ Weather integration
- ❌ Photo upload on daily reports
- ❌ Subcontractor portal
- ❌ Inspection checklists (basic UI exists, need full workflow)

### 🏘️ Property Center
- ❌ **Tenant portal** (read-only access for tenants)
- ❌ Online lease application form
- ❌ Lease document e-signature (in-browser signature pad)
- ❌ Property comparison view
- ❌ **QR code on unit for maintenance requests**
- ❌ Marketing listing integration (Property Finder, Bayut)

### 💰 Finance Center
- ❌ **Wiring `financial` package** (IRR, NPV, PMT, FV)
- ❌ Cash flow forecasting with charts
- ❌ Bank reconciliation workflow
- ❌ **VAT calculations and reports**
- ❌ Budget vs actual variance alerts
- ❌ Multi-currency support
- ❌ ZATCA-compliant e-invoicing (for Saudi)
- ❌ Payment gateway integration (HyperPay/Moyasar)

### 🔧 Maintenance Center
- ❌ **QR code generation for assets**
- ❌ **QR code scanning for work orders**
- ❌ Mobile-friendly work order form
- ❌ Photo upload on work orders
- ❌ Preventive maintenance auto-scheduling
- ❌ Vendor/contractor portal for maintenance
- ❌ IoT sensor integration

### 🛒 Procurement Center
- ❌ Vendor portal (for quote submission)
- ❌ Automated RFQ to recommended vendors
- ❌ Approval workflow customization
- ❌ **3-way matching visualization polish**
- ❌ Spend analytics by category/vendor
- ❌ Integration with Tradeling/Tejari

---

## PRIORITY IMPLEMENTATION QUEUE (NEXT 90 DAYS)

### 🔴 CRITICAL (do first)
1. **Add Vitest + Playwright** — no tests at all, app could break silently
2. **Wire `frappe-gantt` into ProjectDetailPage** — package installed, 0 usage
3. **Wire `financial` (IRR/NPV/PMT/FV)** — installed, not used
4. **Wire `pdf-lib` and `jszip`** — installed, not used
5. **Wire `qrcode` for assets/units** — installed, not used
6. **Wire `@yudiel/react-qr-scanner` for maintenance** — installed, not used
7. **Build in-app notification center** — bell exists, not wired
8. **Wire document upload to real storage** — currently fake

### 🟠 HIGH (next 30 days)
9. Add geocoding to LandCreatePage (place name search)
10. Build client-side signature pad for lease contracts
11. Add VAT calculation and reports (Qatar/UAE/KSA rates)
12. Build photo upload for work orders and daily reports
13. Build tenant portal (read-only)
14. Add real Supabase connection (or keep localStorage for now per user request)
15. Add multi-language support (currently Arabic + broken English)

### 🟡 MEDIUM (next 60 days)
16. Wire all GCC compliance modules (ZATCA, VAT, GOSI, WPS)
17. Integrate payment gateway (HyperPay or Moyasar)
18. Add Unifonic (MENA SMS) or Twilio for SMS
19. Add Resend for email notifications
20. Add e-signature API (DocuSign or Zoho Sign)
21. Add Nafath/UAE PASS for tenant identity

### 🟢 LOW (next 90+ days)
22. BIM/3D model viewer (web-ifc)
23. Biometric attendance (zkteco-js)
24. ERPNext architecture study for reference
25. All enterprise SaaS integrations (Procore, Yardi, etc.)

---

## INSTALLED BUT UNUSED NPM PACKAGES (Quick Wins)

These packages are in `package.json` but not yet imported anywhere:

```
frappe-gantt         → wire to ProjectDetailPage timeline tab
financial            → wire to ProjectDetailPage financial analysis
pdf-lib              → wire to PDF generation utilities
jszip                → wire to "Download all docs as ZIP" feature
qrcode               → wire to UnitDetailPage, EquipmentPage
@yudiel/react-qr-scanner → wire to MaintenanceRequestDetailPage
```

**Total:** 6 packages installed but completely unused = wasted ~2MB of bundle.

---

## SUMMARY OF NEXT STEPS

1. **Review this file** and pick which features to prioritize
2. **Wire 6 installed-but-unused packages** (estimated 1 day total)
3. **Add testing infrastructure** (Vitest + Playwright, estimated 1 day)
4. **Build real-time notification center** (estimated 2 days)
5. **Build tenant portal** (estimated 1 week)
6. **Add GCC compliance modules** (estimated 2 weeks)
7. **Integrate payment gateway** (estimated 1 week)
8. **Wire 80+ SaaS APIs** (deferred — need backend first)

**Estimated total to reach 80% coverage:** 3-6 months of focused development.

---

## RELATED FILES

- `C:\Users\khamis\Documents\land2\TOOLS_AND_SKILLS_MASTER_LIST.md` — source master list (180+ tools)
- `C:\Users\khamis\Documents\land2\.hermes\plans\2026-06-01-feature-implementation-plan.md` — earlier phase plan
- `C:\Users\khamis\Documents\land2\package.json` — installed dependencies
- `C:\Users\khamis\Documents\land2\src\pages\` — 115 page files
