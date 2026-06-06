import { describe, it, expect } from 'vitest';
import { formatQAR, formatQARInt, formatDecimal, formatPercent, formatArea, formatThousand, formatCompact, parseQAR } from '@/lib/format';

describe('format utilities', () => {
  describe('formatQAR', () => {
    it('formats positive numbers with QAR currency', () => {
      const result = formatQAR(1234.56);
      expect(result).toContain('1,234');
      expect(result).toContain('QAR');
    });

    it('handles zero', () => {
      const result = formatQAR(0);
      expect(result).toBeDefined();
      expect(result).toContain('QAR');
    });

    it('handles negative numbers', () => {
      const result = formatQAR(-500);
      expect(result).toBeDefined();
    });

    it('handles very large numbers', () => {
      const result = formatQAR(1_000_000_000);
      expect(result).toBeDefined();
      expect(result).toContain('1,000,000,000');
    });
  });

  describe('formatQARInt', () => {
    it('formats as integer', () => {
      const result = formatQARInt(1234.99);
      expect(result).toContain('1,235');
    });

    it('handles zero', () => {
      const result = formatQARInt(0);
      expect(result).toBeDefined();
    });
  });

  describe('formatDecimal', () => {
    it('preserves 2 decimals', () => {
      const result = formatDecimal(123.4);
      expect(result).toBe('123.40');
    });
  });

  describe('formatPercent', () => {
    it('multiplies by 100 and adds %', () => {
      expect(formatPercent(0.856)).toBe('85.6%');
    });
  });

  describe('formatArea', () => {
    it('adds m² suffix', () => {
      const result = formatArea(1234.5);
      expect(result).toContain('1,234.5');
      expect(result).toContain('م²');
    });
  });

  describe('formatThousand', () => {
    it('formats with thousand separators', () => {
      expect(formatThousand(1234567)).toBe('1,234,567');
    });
  });

  describe('formatCompact', () => {
    it('formats millions with M suffix', () => {
      expect(formatCompact(1_500_000)).toBe('1.5M');
    });
    it('formats thousands with K suffix', () => {
      expect(formatCompact(2500)).toBe('2.5K');
    });
    it('returns as string for small numbers', () => {
      expect(formatCompact(500)).toBe('500');
    });
  });

  describe('parseQAR', () => {
    it('parses formatted QAR string back to number', () => {
      expect(parseQAR('QAR 1,234.56')).toBe(1234.56);
    });
    it('handles strings with no currency symbol', () => {
      expect(parseQAR('1234')).toBe(1234);
    });
  });
});
