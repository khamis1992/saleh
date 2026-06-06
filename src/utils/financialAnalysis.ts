// Financial analysis utilities for real estate projects and land investments
// Wraps the `financial` package (numpy-financial port) + pure TS for ROI/payback
import { irr, npv, pmt, fv, pv } from 'financial';

/**
 * Internal Rate of Return. Returns 0 if cashflows don't converge.
 * @param initialInvestment - typically negative (e.g. -1000000)
 * @param cashFlows - array of yearly cash flows
 */
export function calculateIRR(initialInvestment: number, cashFlows: number[]): number {
  try {
    const allFlows = [initialInvestment, ...cashFlows];
    const result = irr(allFlows);
    if (!isFinite(result) || isNaN(result)) return 0;
    return result;
  } catch {
    return 0;
  }
}

/**
 * Net Present Value at the given discount rate.
 */
export function calculateNPV(rate: number, initialInvestment: number, cashFlows: number[]): number {
  try {
    const allFlows = [initialInvestment, ...cashFlows];
    return npv(rate, allFlows);
  } catch {
    return 0;
  }
}

/**
 * Monthly loan payment (PMT).
 */
export function calculatePMT(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  return pmt(monthlyRate, months, -principal);
}

/**
 * Future value of regular payments + present value.
 */
export function calculateFV(annualRate: number, years: number, monthlyPayment: number, presentValue: number = 0): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  return fv(monthlyRate, months, -monthlyPayment, -presentValue);
}

/**
 * Present value of a future amount.
 */
export function calculatePV(futureValue: number, annualRate: number, years: number): number {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  return pv(monthlyRate, months, 0, -futureValue);
}

/**
 * Return on Investment as a percentage.
 */
export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0;
  return (gain / cost) * 100;
}

/**
 * Payback period in years. Returns Infinity if never recovered.
 */
export function calculatePaybackPeriod(initialInvestment: number, annualCashFlow: number): number {
  if (annualCashFlow <= 0) return Infinity;
  return Math.abs(initialInvestment) / annualCashFlow;
}

/**
 * Generate a loan amortization schedule.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
): { month: number; payment: number; interest: number; principal: number; balance: number }[] {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  const monthlyPayment = pmt(monthlyRate, months, -principal);
  const schedule: { month: number; payment: number; interest: number; principal: number; balance: number }[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPaid);
    schedule.push({
      month: m,
      payment: monthlyPayment,
      interest,
      principal: principalPaid,
      balance,
    });
  }
  return schedule;
}
