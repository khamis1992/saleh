/**
 * Financial math utilities — IRR, NPV, PMT calculations
 * Pure TypeScript implementation, no external math library needed
 */

/**
 * Net Present Value
 * @param rate Discount rate (e.g., 0.1 for 10%)
 * @param cashflows Array of cash flows (negative = investment, positive = return)
 * @returns NPV value
 */
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

/**
 * Internal Rate of Return (using Newton's method)
 * @param cashflows Array of cash flows
 * @param guess Initial guess for IRR (default 0.1 = 10%)
 * @returns IRR as decimal (e.g., 0.15 = 15%)
 */
export function irr(cashflows: number[], guess: number = 0.1): number {
  const maxIterations = 1000;
  const tolerance = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    const f = npv(rate, cashflows);
    const df = cashflows.reduce((sum, cf, t) => sum - (t * cf) / Math.pow(1 + rate, t + 1), 0);

    if (Math.abs(df) < tolerance) break;

    const newRate = rate - f / df;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }

  return rate;
}

/**
 * IRR as percentage string
 */
export function irrPercent(cashflows: number[], guess?: number): string {
  return `${(irr(cashflows, guess) * 100).toFixed(2)}%`;
}

/**
 * Loan/mortgage payment (PMT)
 * @param rate Annual interest rate (e.g., 0.05 = 5%)
 * @param periods Number of payment periods (e.g., 360 for 30-year monthly)
 * @param presentValue Loan amount
 * @param futureValue Future value (default 0)
 * @returns Payment amount per period
 */
export function pmt(rate: number, periods: number, presentValue: number, futureValue: number = 0): number {
  if (rate === 0) return -(presentValue + futureValue) / periods;
  const pvif = Math.pow(1 + rate, periods);
  return -(rate * (presentValue * pvif + futureValue)) / (pvif - 1);
}

/**
 * Future Value
 * @param rate Rate per period
 * @param periods Number of periods
 * @param payment Payment per period
 * @param presentValue Present value (default 0)
 * @returns Future value
 */
export function fv(rate: number, periods: number, payment: number, presentValue: number = 0): number {
  if (rate === 0) return -(presentValue + payment * periods);
  const pvif = Math.pow(1 + rate, periods);
  return -(presentValue * pvif + (payment / rate) * (pvif - 1));
}

/**
 * ROI (Return on Investment)
 */
export function roi(investment: number, returns: number): number {
  if (investment === 0) return 0;
  return ((returns - investment) / investment);
}

/**
 * ROI as percentage string
 */
export function roiPercent(investment: number, returns: number): string {
  return `${(roi(investment, returns) * 100).toFixed(1)}%`;
}

/**
 * Payback period in years
 */
export function paybackPeriod(cashflows: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < cashflows.length; i++) {
    cumulative += cashflows[i];
    if (cumulative >= 0) {
      // Linear interpolation for fractional year
      if (i === 0) return 0;
      const prev = cumulative - cashflows[i];
      return i - 1 + (-prev / cashflows[i]);
    }
  }
  return Infinity;
}

/**
 * Annual depreciation (straight-line)
 */
export function straightLineDepreciation(cost: number, salvage: number, life: number): number {
  if (life === 0) return 0;
  return (cost - salvage) / life;
}
