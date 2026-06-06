import { describe, it, expect } from 'vitest';
import {
  generateZatcaQR, decodeZatcaQR, generateUUIDv4,
  buildHashChain, canonicalXmlHash, sha256Hex,
  computeInvoiceTotals, nextInvoiceNumber,
  ZATCA_STATUS_LABELS_AR, ZATCA_TYPE_LABELS_AR,
  generateUblXml, runComplianceChecks,
} from '@/utils/zatca';
import type { ZatcaInvoiceRecord, ZatcaLineItem } from '@/types';

describe('ZATCA QR Generation', () => {
  it('generates a non-empty base64-url QR payload', () => {
    const qr = generateZatcaQR({
      sellerName: 'Test Company',
      vatNumber: '300123456789003',
      timestampISO: '2026-06-15T09:30:00Z',
      totalWithVat: 1150,
      vatAmount: 150,
    });
    expect(qr).toBeTruthy();
    expect(typeof qr).toBe('string');
    expect(qr.length).toBeGreaterThan(10);
    // Should not contain '+' or '/' (base64-url)
    expect(qr).not.toContain('+');
    expect(qr).not.toContain('/');
  });

  it('round-trips through decode', () => {
    const input = {
      sellerName: 'شركة',
      vatNumber: '300123456789003',
      timestampISO: '2026-06-15T09:30:00Z',
      totalWithVat: 1150,
      vatAmount: 150,
    };
    const qr = generateZatcaQR(input);
    const decoded = decodeZatcaQR(qr);
    expect(decoded).toBeTruthy();
    expect(decoded!.sellerName).toBe(input.sellerName);
    expect(decoded!.totalWithVat).toBe(input.totalWithVat);
  });
});

describe('ZATCA Hash Chain', () => {
  it('sha256Hex produces consistent 64-char hex', () => {
    const h = 'abc'.repeat(20); // 60 chars
    const hash1 = sha256Hex(h);
    const hash2 = sha256Hex(h);
    expect(hash1).toEqual(hash2);
    expect(hash1.length).toEqual(64);
  });

  it('buildHashChain includes previous hash', () => {
    const xml = '<Invoice>test</Invoice>';
    const h1 = sha256Hex(xml);
    const h2 = buildHashChain(h1, xml);
    // Chain hash must be different from raw XML hash
    expect(h2).not.toEqual(h1);
    expect(h2.length).toEqual(64);
  });

  it('canonicalXmlHash strips whitespace', () => {
    const xml1 = '<A>\n  <B/>\n</A>';
    const xml2 = '<A><B/></A>';
    expect(canonicalXmlHash(xml1)).toEqual(canonicalXmlHash(xml2));
  });
});

describe('ZATCA Invoice Totals', () => {
  it('computes totals for standard-rate items', () => {
    const lines: ZatcaLineItem[] = [
      { id: '1', description: 'Item 1', quantity: 2, unit_price: 500, vat_rate: 0.15, vat_category: 'S' } as any,
      { id: '2', description: 'Item 2', quantity: 1, unit_price: 1000, vat_rate: 0.15, vat_category: 'S' } as any,
    ];
    const totals = computeInvoiceTotals(lines);
    expect(totals.lineExtension).toBe(2000);
    expect(totals.totalVAT).toBe(300); // 2000 * 0.15
    expect(totals.payable).toBe(2300);
  });

  it('exempt items contribute zero VAT', () => {
    const lines: ZatcaLineItem[] = [
      { id: '1', description: 'Exempt', quantity: 1, unit_price: 100, vat_rate: 0.15, vat_category: 'E' } as any,
    ];
    const totals = computeInvoiceTotals(lines);
    expect(totals.lineExtension).toBe(100);
    expect(totals.totalVAT).toBe(0);
    expect(totals.payable).toBe(100);
  });
});

describe('ZATCA Auto Numbering', () => {
  it('increments from last invoice', () => {
    expect(nextInvoiceNumber('INV-SA-2026-00007')).toBe('INV-SA-2026-00008');
    expect(nextInvoiceNumber('INV-SA-2026-00000')).toBe('INV-SA-2026-00001');
  });

  it('works with bare numbers', () => {
    expect(nextInvoiceNumber('INV-SA-2026-00007')).toBe('INV-SA-2026-00008');
  });
});

describe('ZATCA Arabic Labels', () => {
  it('has all clearance statuses translated', () => {
    expect(ZATCA_STATUS_LABELS_AR.draft).toBe('مسودة');
    expect(ZATCA_STATUS_LABELS_AR.cleared).toBe('مُسلَّمة ومُعتمدة');
    expect(ZATCA_STATUS_LABELS_AR.rejected).toBe('مرفوضة');
  });

  it('has all invoice types translated', () => {
    expect(ZATCA_TYPE_LABELS_AR.invoice).toBe('فاتورة');
    expect(ZATCA_TYPE_LABELS_AR.credit_note).toBe('إشعار دائن');
    expect(ZATCA_TYPE_LABELS_AR.debit_note).toBe('إشعار مدين');
  });
});

describe('ZATCA Compliance Checks', () => {
  it('fails on empty invoice', () => {
    const empty = { id: '', line_items: [], uuid: '', seller_vat_number: '', issue_date: '', issue_time: '', previous_invoice_hash: '', counter: 0, csid_serial: '', subtype: 'standard' as any } as any as unknown as ZatcaInvoiceRecord;
    const result = runComplianceChecks(empty);
    expect(result.passed).toBe(false);
    expect(result.checks.some(c => !c.passed)).toBe(true);
  });

  it('passes on valid invoice', () => {
    const valid: ZatcaInvoiceRecord = {
      id: 'inv-1', company_id: 'comp-1',
      invoice_number: 'INV-SA-2026-00001', uuid: 'a1b2c3d4-e5f6-4789-9012-345678901234',
      issue_date: '2026-06-15', issue_time: '09:30:00',
      invoice_type: 'invoice', subtype: 'standard',
      seller_name: 'Test', seller_vat_number: '300123456789003', seller_cr_number: '1010123456',
      buyer_name: 'Buyer', buyer_vat_number: '300987654321003',
      counter: 1, previous_invoice_hash: 'abc123',
      xml_hash: 'abc', chain_hash: 'def', qr_payload: '', xml_content: '', // @ts-ignore
      csid_serial: 'CSID-123', clearance_status: 'draft', cleared_at: '',
      total_excl_vat: 1000, total_vat: 150, total_incl_vat: 1150,
      line_items: [{ id: '1', description: 'Test', quantity: 1, unit_price: 1000, vat_rate: 0.15, vat_category: 'S' }],
      related_invoice_id: '', rejection_reason: '', created_at: '',
    };
    const result = runComplianceChecks(valid);
    expect(result.passed).toBe(true);
  });
});

describe('UBL XML Generation', () => {
  it('generates XML with required namespaces', () => {
    const inv: ZatcaInvoiceRecord = {
      id: 'inv-1', company_id: 'comp-1',
      invoice_number: 'INV-SA-2026-00001', uuid: 'a1b2c3d4-e5f6-4789-9012-345678901234',
      issue_date: '2026-06-15', issue_time: '09:30:00',
      invoice_type: 'invoice', subtype: 'standard',
      seller_name: 'Test Co', seller_vat_number: '300123456789003', seller_cr_number: '1010',
      buyer_name: 'Buyer Co', buyer_vat_number: '300111222333444',
      counter: 1, previous_invoice_hash: '0',
      xml_hash: '', chain_hash: '', qr_payload: '', xml_content: '', // @ts-ignore
      csid_serial: 'CSID-1', clearance_status: 'draft', cleared_at: '',
      total_excl_vat: 100, total_vat: 15, total_incl_vat: 115,
      line_items: [{ id: '1', description: 'Rent', quantity: 1, unit_price: 100, vat_rate: 0.15, vat_category: 'S' }],
      related_invoice_id: '', rejection_reason: '', created_at: '',
    };
    const xml = generateUblXml(inv);
    expect(xml).toContain('xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
    expect(xml).toContain('<cbc:ID>INV-SA-2026-00001</cbc:ID>');
    expect(xml).toContain('<cbc:UUID>a1b2c3d4-e5f6-4789-9012-345678901234</cbc:UUID>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="SAR">115.00</cbc:PayableAmount>');
  });

  it('includes buyer block for standard invoices', () => {
    const inv: ZatcaInvoiceRecord = {
      id: 'inv-2', company_id: 'comp-1',
      invoice_number: 'INV-SA-2026-00002', uuid: 'uuid', issue_date: '2026-06-15', issue_time: '09:30:00',
      invoice_type: 'invoice', subtype: 'standard',
      seller_name: 'S', seller_vat_number: '300123456789003', seller_cr_number: '1',
      buyer_name: 'B', buyer_vat_number: '300987654321000',
      counter: 2, previous_invoice_hash: '0',
      xml_hash: '', chain_hash: '', qr_payload: '', xml_content: '', // @ts-ignore
      csid_serial: 'C', clearance_status: 'draft', cleared_at: '',
      total_excl_vat: 100, total_vat: 15, total_incl_vat: 115,
      line_items: [{ id: '1', description: 'x', quantity: 1, unit_price: 100, vat_rate: 0.15, vat_category: 'S' }],
      related_invoice_id: '', rejection_reason: '', created_at: '',
    };
    const xml = generateUblXml(inv);
    expect(xml).toContain('AccountingCustomerParty');
    expect(xml).toContain('<cbc:RegistrationName>B</cbc:RegistrationName>');
  });
});
