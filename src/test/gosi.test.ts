import { describe, it, expect } from 'vitest';
import {
  calculateGosi, GOSI_CONFIG, computeGosiTotals,
  gosiPeriodLabel, buildGosiContribution,
} from '@/utils/gosi';
import type { GosiContribution } from '@/types';

describe('GOSI Calculations', () => {
  it('calculates Saudi employee contribution capped at 9,000', () => {
    const result = calculateGosi({
      subscriber_type: 'saudi',
      basic_salary: 10000,
      housing_allowance: 4000,
      gross_salary: 14000,
    });
    expect(result.contributory_wage).toBe(9000); // capped
    expect(result.employee_pension).toBeCloseTo(810, 2);  // 9000 * 0.09
    expect(result.employer_pension).toBeCloseTo(810, 2);
    expect(result.employer_saned).toBeCloseTo(180, 2);   // 9000 * 0.02
    expect(result.total_employee_share).toBeCloseTo(810, 2);
    expect(result.total_employer_share).toBeCloseTo(990, 2); // 810 + 180
    expect(result.total_contribution).toBeCloseTo(1800, 2);  // 810 + 990
    expect(result.is_capped).toBe(true);
  });

  it('calculates Saudi employee under the cap', () => {
    const result = calculateGosi({
      subscriber_type: 'saudi',
      basic_salary: 3000,
      housing_allowance: 1500,
      gross_salary: 5000,
    });
    expect(result.contributory_wage).toBe(4500); // not capped
    expect(result.total_employee_share).toBeCloseTo(405, 2);
    expect(result.is_capped).toBe(false);
  });

  it('calculates non-Saudi (occupational hazards only)', () => {
    const result = calculateGosi({
      subscriber_type: 'non_saudi',
      basic_salary: 4500,
      housing_allowance: 1500,
      gross_salary: 6000,
    });
    expect(result.total_employee_share).toBe(0);   // no pension
    expect(result.employer_saned).toBeCloseTo(120, 2); // 6000 * 0.02
    expect(result.total_employer_share).toBeCloseTo(120, 2);
  });
});

describe('GOSI Totals', () => {
  it('aggregates multiple contributions', () => {
    const contribs: GosiContribution[] = [
      { id: '1', company_id: 'c', subscriber_type: 'saudi', subscriber_id: 's1', subscriber_name: 'A', nationality: 'سعودي', gross_salary: 10000, basic_salary: 7000, housing_allowance: 3000, monthly_wage: 9000, pension_rate: 0.09, saned_rate: 0.02, employer_total_rate: 0.11, notes: '' } as any,
      { id: '2', company_id: 'c', subscriber_type: 'saudi', subscriber_id: 's2', subscriber_name: 'B', nationality: 'سعودي', gross_salary: 8000, basic_salary: 6000, housing_allowance: 2000, monthly_wage: 8000, pension_rate: 0.09, saned_rate: 0.02, employer_total_rate: 0.11, notes: '' } as any,
    ];
    const totals = computeGosiTotals(contribs);
    expect(totals.employee_count).toBe(2);
    expect(totals.total_employee_share).toBeCloseTo(9000 * 0.09 + 8000 * 0.09, 0);
    expect(totals.total_contributions).toBeGreaterThan(0);
  });
});

describe('GOSI Period Label', () => {
  it('formats Arabic month name', () => {
    expect(gosiPeriodLabel('2026-01')).toBe('يناير 2026');
    expect(gosiPeriodLabel('2026-12')).toBe('ديسمبر 2026');
  });
});

describe('GOSI Config', () => {
  it('wage cap is 9000', () => {
    expect(GOSI_CONFIG.monthlyWageCap).toBe(9000);
  });

  it('Saudi total employer rate is 11%', () => {
    expect(GOSI_CONFIG.saudi.totalEmployer).toBeCloseTo(0.11);
  });
});
