import { describe, it, expect } from 'vitest';
import {
  calculateLandAcquisitionCost,
  calculateInvoiceBalance,
  computeInvoiceTotals,
  calculateProjectCompletion,
  validateReceiptAmount,
  validateLeaseContractDates,
  validateInvoiceTotal,
  canUnitBeLeased,
  computeDashboardKPIs,
} from '@/utils/businessLogic';

describe('businessLogic', () => {
  describe('calculateLandAcquisitionCost', () => {
    it('sums all acquisition cost components', () => {
      const result = calculateLandAcquisitionCost({
        acquisition_price: 1_000_000,
        broker_commission: 50_000,
        registration_fees: 20_000,
        legal_fees: 15_000,
        other_costs: 10_000,
      });
      expect(result).toBe(1_095_000);
    });

    it('handles zero values', () => {
      const result = calculateLandAcquisitionCost({
        acquisition_price: 0,
        broker_commission: 0,
        registration_fees: 0,
        legal_fees: 0,
        other_costs: 0,
      });
      expect(result).toBe(0);
    });

    it('handles missing fields', () => {
      const result = calculateLandAcquisitionCost({});
      expect(result).toBe(0);
    });
  });

  describe('calculateInvoiceBalance', () => {
    it('returns balance when paid less than total', () => {
      const result = calculateInvoiceBalance({ total: 1000, paid_amount: 300 });
      expect(result.balance).toBe(700);
      expect(result.status).toBe('partially_paid');
    });

    it('marks as paid when fully paid', () => {
      const result = calculateInvoiceBalance({ total: 1000, paid_amount: 1000 });
      expect(result.balance).toBe(0);
      expect(result.status).toBe('paid');
    });

    it('marks as issued for fresh invoice', () => {
      const result = calculateInvoiceBalance({ total: 1000, paid_amount: 0 });
      expect(result.status).toBe('issued');
    });

    it('marks as overdue when past due date with balance', () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      const result = calculateInvoiceBalance({ total: 1000, paid_amount: 0, due_date: past.toISOString() });
      expect(result.status).toBe('overdue');
    });
  });

  describe('computeInvoiceTotals', () => {
    it('sums rent + charges + penalties - discounts', () => {
      const result = computeInvoiceTotals(5000, 500, 0, 0, 0);
      expect(result.total).toBe(5500);
    });

    it('handles discounts', () => {
      const result = computeInvoiceTotals(5000, 500, 0, 0, 200);
      expect(result.total).toBe(5300);
    });

    it('clamps to zero on negative total', () => {
      const result = computeInvoiceTotals(100, 0, 0, 0, 200);
      expect(result.total).toBe(0);
    });
  });

  describe('calculateProjectCompletion', () => {
    it('averages phase progress', () => {
      const phases = [
        { progress_percentage: 50 },
        { progress_percentage: 75 },
        { progress_percentage: 100 },
      ];
      const result = calculateProjectCompletion(phases);
      expect(result).toBe(75);
    });

    it('returns 0 for empty phases', () => {
      const result = calculateProjectCompletion([]);
      expect(result).toBe(0);
    });
  });

  describe('validateReceiptAmount', () => {
    it('rejects negative amount', () => {
      const result = validateReceiptAmount(-100);
      expect(result.valid).toBe(false);
    });

    it('rejects zero amount', () => {
      const result = validateReceiptAmount(0);
      expect(result.valid).toBe(false);
    });

    it('accepts positive amount', () => {
      const result = validateReceiptAmount(500);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateLeaseContractDates', () => {
    it('rejects missing dates', () => {
      const result = validateLeaseContractDates('', '');
      expect(result.valid).toBe(false);
    });

    it('rejects end before start', () => {
      const result = validateLeaseContractDates('2026-06-30', '2026-06-01');
      expect(result.valid).toBe(false);
    });

    it('accepts valid date range', () => {
      const result = validateLeaseContractDates('2026-06-01', '2027-06-01');
      expect(result.valid).toBe(true);
    });
  });

  describe('canUnitBeLeased', () => {
    it('rejects units under maintenance', () => {
      const result = canUnitBeLeased({ status: 'under_maintenance' } as any);
      expect(result).toBe(false);
    });
    it('rejects sold units', () => {
      const result = canUnitBeLeased({ status: 'sold' } as any);
      expect(result).toBe(false);
    });
    it('accepts available units', () => {
      const result = canUnitBeLeased({ status: 'available' } as any);
      expect(result).toBe(true);
    });
  });

  describe('computeDashboardKPIs', () => {
    it('computes correct occupancy rate', () => {
      const result = computeDashboardKPIs({
        lands: [],
        projects: [],
        properties: [],
        units: [
          { status: 'leased' },
          { status: 'leased' },
          { status: 'available' },
        ],
        invoices: [],
        maintenance: [],
      });
      expect(result.occupancyRate).toBeCloseTo(66.7, 1);
      expect(result.leasedUnits).toBe(2);
      expect(result.availableUnits).toBe(1);
    });
  });
});
