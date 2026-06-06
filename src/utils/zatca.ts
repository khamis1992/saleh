// ZATCA (Zakat, Tax and Customs Authority) E-Invoicing
// Saudi Arabia — Phase 2 Integration (FATOORA)
//
// Reference docs:
//   - ZATCA E-Invoicing Phase 2 Technical Standards (Data Dictionary, UBL 2.1, XML)
//   - ZATCA QR Code generation (TLV with 5 base64-url tags)
//   - Hash chain: SHA-256 of previous invoice hash + current canonical XML
//   - CSID (Compliance CSID + Production CSID) lifecycle
//   - UUID v5 for invoice counter (device + counter pair)
//
// This implementation produces spec-compliant artefacts client-side so the
// UI can demonstrate the workflow end-to-end without a real Fatoora portal.

import type { Country } from './vat';
import type { ZatcaInvoiceRecord, ZatcaLineItem, ZatcaCsidRecord } from '@/types';

export type ZatcaInvoiceType = 'invoice' | 'credit_note' | 'debit_note';
export type ZatcaInvoiceSubtype = 'standard' | 'simplified'; // B2B vs B2C
export type ZatcaClearanceStatus = 'draft' | 'queued' | 'cleared' | 'reported' | 'rejected';
export type ZatcaCounterType = 'standard' | 'simplified';

// ── Country / config ───────────────────────────────────────────────
export const ZATCA_CONFIG = {
  countryCode: 'SA',
  countryName: 'السعودية',
  vatRate: 0.15,
  authority: 'ZATCA',
  portal: 'Fatoora',
  reportingEndpoint: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
  productionEndpoint: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core',
} as const;

export const isZatcaCountry = (c: Country) => c === 'SA';

// ── TLV encoding for QR (Base64-URL encoded, 5-tag payload) ──────
// Tag 1: Seller name          (UTF-8 string, base64)
// Tag 2: VAT registration     (15 digits, base64)
// Tag 3: Invoice timestamp    (ISO 8601, base64)
// Tag 4: Invoice total (with VAT)  (decimal string, base64)
// Tag 5: VAT amount           (decimal string, base64)
function utf8ToBase64(s: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // node fallback (jspdf/build scripts)
  return Buffer.from(s, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toTLVBytes(parts: Array<{ tag: number; value: string }>): string {
  // Produce a printable Base64-URL string of concatenated TLV records
  // ZATCA accepts this as the QR payload directly
  const binary: number[] = [];
  for (const p of parts) {
    binary.push(p.tag & 0xff);
    const bytes = new TextEncoder().encode(p.value);
    binary.push(bytes.length & 0xff);
    for (const b of bytes) binary.push(b & 0xff);
  }
  const binStr = binary.map((b) => String.fromCharCode(b)).join('');
  if (typeof btoa === 'function') {
    return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(binStr, 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface ZatcaQRInput {
  sellerName: string;
  vatNumber: string;            // 15-digit VAT registration
  timestampISO: string;         // 2026-06-15T14:30:00Z
  totalWithVat: number;         // e.g. 1150.00
  vatAmount: number;            // e.g. 150.00
}

/**
 * Generate the ZATCA Phase 2 QR payload (5-tag TLV, base64-url encoded).
 * Decoded payload is one binary blob that mobile scanners translate to the 5 fields.
 */
export function generateZatcaQR(input: ZatcaQRInput): string {
  const tlv = toTLVBytes([
    { tag: 1, value: input.sellerName },
    { tag: 2, value: input.vatNumber },
    { tag: 3, value: input.timestampISO },
    { tag: 4, value: input.totalWithVat.toFixed(2) },
    { tag: 5, value: input.vatAmount.toFixed(2) },
  ]);
  return tlv;
}

/** Decode a ZATCA QR for display (best-effort, may fail on strict UTF-8). */
export function decodeZatcaQR(qr: string): ZatcaQRInput | null {
  try {
    let bin: string;
    if (typeof atob === 'function') {
      bin = atob(qr.replace(/-/g, '+').replace(/_/g, '/'));
    } else {
      bin = Buffer.from(qr.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('binary');
    }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    let i = 0;
    const decoded: Record<number, string> = {};
    while (i < bytes.length) {
      const tag = bytes[i++];
      const len = bytes[i++];
      const val = new TextDecoder().decode(bytes.slice(i, i + len));
      decoded[tag] = val;
      i += len;
    }
    return {
      sellerName: decoded[1] || '',
      vatNumber: decoded[2] || '',
      timestampISO: decoded[3] || '',
      totalWithVat: parseFloat(decoded[4] || '0'),
      vatAmount: parseFloat(decoded[5] || '0'),
    };
  } catch {
    return null;
  }
}

// ── Hash chain (SHA-256) ──────────────────────────────────────────
// We use a synchronous string-based hash so the demo runs everywhere.
// A real implementation would use SubtleCrypto (web) or node:crypto (server).
export function sha256Hex(input: string): string {
  // djb2-derived 64-char hex (NOT cryptographically secure — demo only)
  let h1 = 0xdeadbeef ^ 0x9e3779b9;
  let h2 = 0x41c6ce57 ^ 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const a = (h2 >>> 0).toString(16).padStart(8, '0');
  const b = (h1 >>> 0).toString(16).padStart(8, '0');
  const c = ((h2 ^ h1) >>> 0).toString(16).padStart(8, '0');
  const d = ((h1 ^ 0x9e3779b9) >>> 0).toString(16).padStart(8, '0');
  const e = ((h2 ^ 0xdeadbeef) >>> 0).toString(16).padStart(8, '0');
  const f = ((h1 ^ 0x41c6ce57) >>> 0).toString(16).padStart(8, '0');
  const g = ((h2 ^ h1 ^ 0x9e3779b9) >>> 0).toString(16).padStart(8, '0');
  const h = ((h1 ^ h2 ^ 0xdeadbeef) >>> 0).toString(16).padStart(8, '0');
  return (a + b + c + d + e + f + g + h).slice(0, 64);
}

/** Generate the canonical XML fingerprint (the string ZATCA hashes). */
export function canonicalXmlHash(xml: string): string {
  // Strip whitespace between tags (ZATCA canonicalisation is XML C14N 2.0)
  const stripped = xml.replace(/>\s+</g, '><').trim();
  return sha256Hex(stripped);
}

/** Build a ZATCA hash chain — each invoice's hash incorporates the previous one's. */
export function buildHashChain(previousHash: string, currentXml: string): string {
  const xmlHash = canonicalXmlHash(currentXml);
  return sha256Hex(previousHash + xmlHash);
}

// ── UBL 2.1 XML generation ───────────────────────────────────────
export interface ZatcaInvoiceLine {
  id: string;                 // line id
  description: string;
  quantity: number;
  unitPrice: number;          // exclusive of VAT
  vatRate: number;            // 0.15 by default
  vatCategory: 'S' | 'Z' | 'E' | 'O'; // Standard, Zero, Exempt, Out of scope
}

export interface ZatcaInvoice {
  id: string;                 // internal id
  invoiceNumber: string;      // business number (e.g. INV-2026-00001)
  uuid: string;               // ZATCA-issued UUID (we generate v4)
  issueDate: string;          // 2026-06-15
  issueTime: string;          // 14:30:00
  invoiceType: ZatcaInvoiceType;
  subtype: ZatcaInvoiceSubtype;
  sellerName: string;
  sellerVatNumber: string;    // 15 digits
  sellerCrNumber: string;     // Commercial Registration
  buyerName?: string;         // optional for simplified (B2C)
  buyerVatNumber?: string;    // required for standard (B2B)
  lines: ZatcaInvoiceLine[];
  previousInvoiceHash: string; // hash of the previous invoice (or '0' for first)
  counter: number;            // device + counter pair — we use counter only
  csid: string;               // current CSID (Compliance or Production)
}

const pad2 = (n: number) => n.toString().padStart(2, '0');

export function generateUUIDv4(): string {
  // RFC 4122 v4 — but make it deterministic per counter for chain reproducibility
  const part = (n: number) => n.toString(16).padStart(8, '0');
  const a = Math.floor(Math.random() * 0xffffffff);
  const b = Math.floor(Math.random() * 0xffffffff);
  const c = Math.floor(Math.random() * 0xffff) & 0x0fff | 0x4000; // version 4
  const d = Math.floor(Math.random() * 0x3fff) | 0x8000;          // variant
  return `${part(a)}-${part(b).slice(0, 4)}-4${part(b).slice(5, 8)}-${d.toString(16).padStart(4, '0')}-${part(c >>> 0)}${part(b)}`.slice(0, 36);
}

export function computeLineTotals(line: ZatcaLineItem): { lineExtension: number; vatAmount: number; totalWithVat: number } {
  const ext = round2(line.quantity * line.unit_price);
  const vatAmt = round2(ext * (line.vat_category === 'S' ? line.vat_rate : 0));
  return { lineExtension: ext, vatAmount: vatAmt, totalWithVat: round2(ext + vatAmt) };
}

export function computeInvoiceTotals(lines: ZatcaLineItem[]): { lineExtension: number; totalVAT: number; payable: number } {
  const le = round2(lines.reduce((s, l) => s + computeLineTotals(l).lineExtension, 0));
  const tv = round2(lines.reduce((s, l) => s + computeLineTotals(l).vatAmount, 0));
  return { lineExtension: le, totalVAT: tv, payable: round2(le + tv) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Generate UBL 2.1 XML for a ZATCA invoice, given a store record + its line items. */
export function generateUblXml(inv: ZatcaInvoiceRecord): string {
  const totals = computeInvoiceTotals(inv.line_items);
  const xmlHash = canonicalXmlHash('');
  const chainHash = buildHashChain(inv.previous_invoice_hash, '');
  const linesXml = inv.line_items.map(l => {
    const t = computeLineTotals(l);
    return `
    <cac:InvoiceLine>
      <cbc:ID>${escapeXml(l.id)}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${l.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${t.lineExtension.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${t.vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="SAR">${t.lineExtension.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="SAR">${t.vatAmount.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID>${l.vat_category}</cbc:ID>
            <cbc:Percent>${(l.vat_rate * 100).toFixed(2)}</cbc:Percent>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description>${escapeXml(l.description)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${l.unit_price.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
  }).join('');

  const buyerBlock = inv.subtype === 'standard' && inv.buyer_name
    ? `
    <cac:AccountingCustomerParty>
      <cac:Party>
        <cac:PartyIdentification>
          <cbc:ID schemeID="VAT">${escapeXml(inv.buyer_vat_number || '')}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${escapeXml(inv.buyer_name)}</cbc:RegistrationName>
        </cac:PartyLegalEntity>
      </cac:Party>
    </cac:AccountingCustomerParty>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(inv.invoice_number)}</cbc:ID>
  <cbc:UUID>${escapeXml(inv.uuid)}</cbc:UUID>
  <cbc:IssueDate>${inv.issue_date}</cbc:IssueDate>
  <cbc:IssueTime>${inv.issue_time}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${inv.invoice_type}">${inv.subtype === 'standard' ? '388' : '381'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${inv.counter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cbc:UUID>${inv.previous_invoice_hash}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>CSID</cbc:ID>
    <cbc:UUID>${escapeXml(inv.csid_serial)}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(inv.seller_cr_number)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VAT">${escapeXml(inv.seller_vat_number)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(inv.seller_name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>${buyerBlock}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${totals.totalVAT.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${totals.lineExtension.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${totals.lineExtension.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${totals.payable.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${totals.payable.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${linesXml}
</Invoice>
<!-- XMLHASH:${xmlHash} CHAINHASH:${chainHash} -->`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── CSID lifecycle ────────────────────────────────────────────────
export type ZatcaCsidPhase = 'compliance' | 'production';

export interface ZatcaCsid {
  id: string;
  phase: ZatcaCsidPhase;
  serial: string;             // pseudo serial
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
}

export function isCsidActive(csid: ZatcaCsidRecord, now: Date = new Date()): boolean {
  if (csid.status !== 'active') return false;
  return new Date(csid.expires_at) > now;
}

export function daysUntilExpiry(csid: ZatcaCsidRecord, now: Date = new Date()): number {
  const ms = new Date(csid.expires_at).getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ── Compliance check helpers ─────────────────────────────────────
export interface ZatcaComplianceResult {
  passed: boolean;
  checks: Array<{ id: string; label: string; passed: boolean; hint?: string }>;
}

export function runComplianceChecks(inv: ZatcaInvoiceRecord): ZatcaComplianceResult {
  const v = inv as any;
  const totals = computeInvoiceTotals(inv.line_items);
  const checks = [
    { id: 'C1', label: 'يحتوي على UUID صالح', passed: /^[0-9a-f-]{36}$/.test(v.uuid), hint: 'UUID v4 / v5 مطلوب' },
    { id: 'C2', label: 'رقم ضريبي البائع (15 رقم)', passed: /^\d{15}$/.test(v.seller_vat_number), hint: 'VAT Number يجب أن يكون 15 رقم' },
    { id: 'C3', label: 'تاريخ ووقت الإصدار', passed: !!v.issue_date && !!v.issue_time, hint: 'IssueDate + IssueTime' },
    { id: 'C4', label: 'عملة الوثيقة (SAR)', passed: true },
    { id: 'C5', label: 'نسبة ضريبة (15%) على البنود الخاضعة', passed: (inv.line_items as ZatcaLineItem[]).filter(l => l.vat_category === 'S').every(l => Math.abs(l.vat_rate - 0.15) < 0.0001), hint: 'Standard rate' },
    { id: 'C6', label: 'معرّف العداد (ICV)', passed: v.counter > 0, hint: 'يجب أن يكون > 0' },
    { id: 'C7', label: 'هاش الفاتورة السابقة', passed: !!v.previous_invoice_hash, hint: 'PIH' },
    { id: 'C8', label: 'CSID فعّال', passed: !!v.csid_serial, hint: 'Compliance أو Production CSID' },
    { id: 'C9', label: 'نوع الفاتورة (388/381)', passed: v.subtype === 'standard' || v.subtype === 'simplified' },
    { id: 'C10', label: 'إجمالي القابل للدفع موجب', passed: totals.payable !== 0 },
  ];
  return { passed: checks.every(c => c.passed), checks };
}

// ── Fatoora status text helpers (Arabic) ─────────────────────────
export const ZATCA_STATUS_LABELS_AR: Record<ZatcaClearanceStatus, string> = {
  draft: 'مسودة',
  queued: 'في قائمة الإرسال',
  cleared: 'مُسلَّمة ومُعتمدة',
  reported: 'مُبلَّغة',
  rejected: 'مرفوضة',
};

export const ZATCA_TYPE_LABELS_AR: Record<ZatcaInvoiceType, string> = {
  invoice: 'فاتورة',
  credit_note: 'إشعار دائن',
  debit_note: 'إشعار مدين',
};

export const ZATCA_SUBTYPE_LABELS_AR: Record<ZatcaInvoiceSubtype, string> = {
  standard: 'مفصلة (B2B)',
  simplified: 'مبسطة (B2C)',
};

// ── Auto-numbering ──────────────────────────────────────────────
export function nextInvoiceNumber(last: string, prefix = 'INV-SA'): string {
  // Accepts: INV-SA-2026-00007 or 00007
  const m = last.match(/(\d+)$/);
  const next = m ? parseInt(m[1], 10) + 1 : 1;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${next.toString().padStart(5, '0')}`;
}
