import { describe, it, expect } from 'vitest';
import {
  calculateIRR, calculateNPV, calculatePMT, calculateFV, calculatePV,
  calculateROI, calculatePaybackPeriod, generateAmortizationSchedule,
} from '@/utils/financialAnalysis';

describe('financialAnalysis', () => {
  describe('calculateIRR', () => {
    it('returns IRR for simple investment', () => {
      // -1000 invested, returns 1100 in year 1
      const r = calculateIRR(-1000, [1100]);
      expect(r).toBeCloseTo(0.1, 2);
    });

    it('returns 0 for non-converging cashflows', () => {
      const r = calculateIRR(-1000, [0, 0, 0]);
      expect(r).toBe(0);
    });
  });

  describe('calculateNPV', () => {
    it('returns positive NPV for profitable project', () => {
      const r = calculateNPV(0.1, -1000, [500, 500, 500]);
      expect(r).toBeGreaterThan(0);
    });

    it('returns negative NPV for unprofitable project', () => {
      const r = calculateNPV(0.1, -1000, [100, 100, 100]);
      expect(r).toBeLessThan(0);
    });
  });

  describe('calculatePMT', () => {
    it('calculates monthly payment on a 100k loan', () => {
      // 100,000 loan at 5% over 30 years
      const pmt = calculatePMT(100000, 0.05, 30);
      expect(pmt).toBeGreaterThan(500);
      expect(pmt).toBeLessThan(600);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculatePMT(0, 0.05, 30)).toBe(0);
      expect(calculatePMT(100000, 0.05, 0)).toBe(0);
    });
  });

  describe('calculateFV', () => {
    it('computes future value of regular savings', () => {
      // Save 1000/month at 5% for 10 years
      const fv = calculateFV(0.05, 10, 1000, 0);
      expect(fv).toBeGreaterThan(150000);
    });
  });

  describe('calculatePV', () => {
    it('discounts a future amount to present', () => {
      // 100,000 in 10 years at 5% discount
      const pv = calculatePV(100000, 0.05, 10);
      expect(pv).toBeGreaterThan(50000);
      expect(pv).toBeLessThan(70000);
    });
  });

  describe('calculateROI', () => {
    it('computes simple ROI', () => {
      expect(calculateROI(500, 1000)).toBe(50);
    });
    it('returns 0 when cost is 0', () => {
      expect(calculateROI(100, 0)).toBe(0);
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('computes simple payback', () => {
      const years = calculatePaybackPeriod(-10000, 2500);
      expect(years).toBe(4);
    });
    it('returns Infinity for non-recovering cashflow', () => {
      expect(calculatePaybackPeriod(-10000, 0)).toBe(Infinity);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('produces correct number of months', () => {
      const schedule = generateAmortizationSchedule(100000, 0.05, 5);
      expect(schedule.length).toBe(60);
    });
    it('ends at zero balance', () => {
      const schedule = generateAmortizationSchedule(100000, 0.05, 5);
      const lastMonth = schedule[schedule.length - 1];
      expect(lastMonth.balance).toBeCloseTo(0, 2);
    });
  });
});
