import { describe, it, expect } from 'vitest';
import {
  computeVAT, computeVATBreakdown, formatVATRate, isVATApplicable, getVATCountries,
  type Country, type TransactionType,
} from '@/utils/vat';

describe('VAT utilities', () => {
  describe('computeVAT', () => {
    it('returns zero VAT for Qatar (0%)', () => {
      const r = computeVAT(1000, 'QA', false, 'rent');
      expect(r.vat).toBe(0);
      expect(r.total).toBe(1000);
    });

    it('computes 5% VAT for UAE on rent', () => {
      const r = computeVAT(1000, 'AE', false, 'rent');
      expect(r.vat).toBe(50);
      expect(r.total).toBe(1050);
    });

    it('computes 15% VAT for Saudi Arabia', () => {
      const r = computeVAT(1000, 'SA', false, 'sale');
      expect(r.vat).toBe(150);
      expect(r.total).toBe(1150);
    });

    it('extracts VAT from inclusive amount', () => {
      const r = computeVAT(1050, 'AE', true, 'rent');
      expect(r.vat).toBeCloseTo(50, 2);
      expect(r.base).toBeCloseTo(1000, 2);
    });

    it('exempts rent in countries where it does not apply', () => {
      const r = computeVAT(1000, 'KW', false, 'rent');
      expect(r.vat).toBe(0);
    });
  });

  describe('computeVATBreakdown', () => {
    it('breaks down mixed transaction types', () => {
      const items = [
        { amount: 5000, type: 'rent' as TransactionType },
        { amount: 10000, type: 'sale' as TransactionType },
        { amount: 2000, type: 'service' as TransactionType },
      ];
      const r = computeVATBreakdown(items, 'AE', false);
      // 5% on all = 17000 * 0.05 = 850
      expect(r.totalBase).toBe(17000);
      expect(r.totalVAT).toBe(850);
      expect(r.totalGross).toBe(17850);
      expect(r.byType.rent.count).toBe(1);
      expect(r.byType.sale.count).toBe(1);
      expect(r.byType.service.count).toBe(1);
    });

    it('handles empty items', () => {
      const r = computeVATBreakdown([], 'AE', false);
      expect(r.totalVAT).toBe(0);
      expect(r.effectiveRate).toBe(0);
    });
  });

  describe('formatVATRate', () => {
    it('formats UAE as 5%', () => {
      expect(formatVATRate('AE')).toBe('5%');
    });
    it('formats Saudi as 15%', () => {
      expect(formatVATRate('SA')).toBe('15%');
    });
    it('formats Qatar as 0%', () => {
      expect(formatVATRate('QA')).toBe('0%');
    });
  });

  describe('isVATApplicable', () => {
    it('UAE rent is applicable', () => {
      expect(isVATApplicable('AE', 'rent')).toBe(true);
    });
    it('Qatar rent is not applicable', () => {
      expect(isVATApplicable('QA', 'rent')).toBe(false);
    });
  });

  describe('getVATCountries', () => {
    it('excludes zero-VAT countries', () => {
      const list = getVATCountries();
      expect(list).not.toContain('QA');
      expect(list).not.toContain('KW');
      expect(list).toContain('AE');
      expect(list).toContain('SA');
    });
  });
});
