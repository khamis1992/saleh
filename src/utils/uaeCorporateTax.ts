// UAE Corporate Tax (CT) — Federal Decree-Law No. 47 of 2022
// Effective for financial years starting on or after 1 June 2023
//
// Core rules:
//   - 9% on taxable income exceeding AED 375,000
//   - 0% on first AED 375,000 (Small Business Relief)
//   - Qualifying Free Zone Person (QFZP): 0% on qualifying income, 9% on non-qualifying
//   - Transfer pricing: arm's length for related-party transactions
//   - Exempt: dividends from participations, capital gains on qualifying shareholdings
//   - Non-deductible: client entertainment, fines, donations (limits), corp tax itself
//
// Filing: annually via FTA EmaraTax portal, 9 months after fiscal year end

import type { UaeCtPeriod, UaeCtLedgerEntry, UaeCtEntityType } from '@/types';

export const UAE_CT_CONFIG = {
  countryCode: 'AE',
  countryName: 'الإمارات',
  authority: 'FTA',
  portal: 'EmaraTax',
  standardRate: 0.09,
  smallBusinessRelief: 375000,           // AED
  smallBusinessRate: 0.00,               // 0% on first 375k
  qualifyingFreeZoneRate: 0.00,          // 0% on qualifying income
  mainNonQualifyingRate: 0.09,           // 9% on non-qualifying income
  transferPricingThreshold: 0,           // arm's length applies to ALL related-party
  filingDeadlineMonths: 9,               // 9 months after FY end
  portalUrl: 'https://eservices.tax.gov.ae',
} as const;

export const isUaeCtCountry = (c: string) => c === 'AE';

export interface CtComputationInput {
  entityType: UaeCtEntityType;
  revenue: number;
  qualifyingIncome: number;          // for QFZP
  nonQualifyingIncome: number;       // for QFZP (taxable at 9%)
  exemptIncome: number;              // dividends, capital gains
  deductibleExpenses: number;
  nonDeductibleExpenses: number;     // client entertainment, fines, etc.
  transferPricingAdjustment: number; // +ve = add to income
  claimSmallBusinessRelief: boolean; // revenue ≤ AED 3M
}

export interface CtComputationOutput {
  totalRevenue: number;
  taxableIncome: number;
  qualifyingIncome: number;
  exemptIncome: number;
  deductibleExpenses: number;
  nonDeductibleExpenses: number;
  transferPricingAdjustment: number;
  appliedSmallBusinessRelief: boolean;
  smallBusinessReliefAmount: number;
  qfzibApplied: boolean;
  qfzibNonQualifyingIncome: number;
  baseTax: number;
  effectiveRate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compute the UAE Corporate Tax for a period.
 * Implements:
 *   - Small Business Relief (0% on first AED 375,000)
 *   - QFZIB 0% on qualifying income
 *   - QFZIB 9% on non-qualifying income
 *   - Transfer pricing adjustments
 *   - Non-deductible expense add-back
 *   - Exempt income deduction
 */
export function computeCorporateTax(input: CtComputationInput): CtComputationOutput {
  const totalRevenue = round2(input.revenue);
  const exempt = round2(input.exemptIncome);
  const deductible = round2(input.deductibleExpenses);
  const nonDeductible = round2(input.nonDeductibleExpenses);
  const tpAdj = round2(input.transferPricingAdjustment);

  // Small Business Relief threshold check — only available if revenue ≤ AED 3M
  const sbrEligible = input.claimSmallBusinessRelief && totalRevenue <= 3_000_000;
  const sbrAmount = sbrEligible ? UAE_CT_CONFIG.smallBusinessRelief : 0;

  // Compute taxable income
  // = Revenue - Exempt - Deductible + Non-Deductible + TP Adjustments - SBR
  const beforeSbr = totalRevenue - exempt - deductible + nonDeductible + tpAdj;
  const taxableAfterSbr = Math.max(0, beforeSbr - sbrAmount);

  let baseTax: number;
  let qualifying = 0;
  let qfzibApplied = false;
  let nonQualifyingTaxable = 0;

  if (input.entityType === 'free_zone_qualifying') {
    // QFZIB — split into qualifying (0%) and non-qualifying (9%)
    qualifying = round2(input.qualifyingIncome);
    const nonQualifying = round2(input.nonQualifyingIncome);
    nonQualifyingTaxable = nonQualifying;

    // Apply SBR only to non-qualifying income
    const nonQualAfterSbr = Math.max(0, nonQualifying - sbrAmount);
    const taxNonQual = nonQualAfterSbr * UAE_CT_CONFIG.mainNonQualifyingRate;
    // Any remaining SBR not used on non-qualifying is forfeited
    baseTax = taxNonQual;
    qfzibApplied = true;
  } else if (input.entityType === 'natural_person') {
    // Natural persons: first AED 375k is exempt (not just 0% — fully exempt from CT)
    // SBR effectively subsumes the threshold
    const afterNatural = Math.max(0, taxableAfterSbr);
    baseTax = afterNatural * UAE_CT_CONFIG.standardRate;
  } else {
    // Mainland or non-qualifying FZ: straight 9% on taxable income after SBR
    baseTax = taxableAfterSbr * UAE_CT_CONFIG.standardRate;
  }

  baseTax = round2(baseTax);
  const effectiveRate = totalRevenue > 0 ? baseTax / totalRevenue : 0;

  return {
    totalRevenue,
    taxableIncome: round2(beforeSbr),
    qualifyingIncome: qualifying,
    exemptIncome: exempt,
    deductibleExpenses: deductible,
    nonDeductibleExpenses: nonDeductible,
    transferPricingAdjustment: tpAdj,
    appliedSmallBusinessRelief: sbrEligible,
    smallBusinessReliefAmount: sbrAmount,
    qfzibApplied,
    qfzibNonQualifyingIncome: nonQualifyingTaxable,
    baseTax,
    effectiveRate,
  };
}

/** Categorise an expense per FTA Corporate Tax guidance. */
export function classifyExpense(description: string): 'deductible' | 'non_deductible' | 'capital' {
  const d = description.toLowerCase();
  // Per FTA guidance: client entertainment (limited), fines, donations, corp tax itself — non-deductible
  if (d.includes('غرامة') || d.includes('جزاء') || d.includes('fine') || d.includes('penalty')) return 'non_deductible';
  if (d.includes('تبرع') || d.includes('صدقة') || d.includes('donation') || d.includes('charity')) return 'non_deductible';
  if (d.includes('ضريبة الشركات') || d.includes('corporate tax') || d.includes('corp tax')) return 'non_deductible';
  if (d.includes('ضيافة عملاء') || d.includes('client entertainment')) return 'non_deductible';
  if (d.includes('أصل') || d.includes('معدات') || d.includes('asset') || d.includes('equipment') || d.includes('capital')) return 'capital';
  return 'deductible';
}

/** Compute the filing deadline (9 months after period end). */
export function computeFilingDeadline(periodEnd: string): string {
  const d = new Date(periodEnd);
  d.setMonth(d.getMonth() + UAE_CT_CONFIG.filingDeadlineMonths);
  return d.toISOString().split('T')[0];
}

/** Build the EmaraTax CT return form payload (demo). */
export interface EmaraTaxReturnPayload {
  taxpayer: {
    trn: string;
    name: string;
    entityType: UaeCtEntityType;
    fiscalYearStart: string;
    fiscalYearEnd: string;
  };
  revenue: number;
  qualifyingIncome: number;
  exemptIncome: number;
  deductibleExpenses: number;
  nonDeductibleExpenses: number;
  transferPricingAdjustment: number;
  smallBusinessReliefClaimed: number;
  taxableIncome: number;
  taxPayable: number;
  generatedAt: string;
  hash: string;
}

export function buildEmaraTaxPayload(period: UaeCtPeriod, company: { name_en: string; tax_number: string }): EmaraTaxReturnPayload {
  return {
    taxpayer: {
      trn: company.tax_number,
      name: company.name_en,
      entityType: period.entity_type,
      fiscalYearStart: period.period_start,
      fiscalYearEnd: period.period_end,
    },
    revenue: period.revenue,
    qualifyingIncome: period.qualifying_income,
    exemptIncome: period.exempt_income,
    deductibleExpenses: period.deductible_expenses,
    nonDeductibleExpenses: period.non_deductible_expenses,
    transferPricingAdjustment: period.transfer_pricing_adjustment,
    smallBusinessReliefClaimed: period.small_business_relief,
    taxableIncome: period.taxable_income,
    taxPayable: period.tax_due,
    generatedAt: new Date().toISOString(),
    hash: period.fta_reference || '',
  };
}

/** Get the next FY period label, e.g. "FY 2026". */
export function nextPeriodLabel(last: string): string {
  const m = last.match(/(\d{4})/);
  const next = m ? parseInt(m[1], 10) + 1 : new Date().getFullYear();
  return `FY ${next}`;
}

/** Period end date for a FY (Dec 31 by default). */
export function computePeriodEnd(fyLabel: string, customEnd?: string): string {
  if (customEnd) return customEnd;
  const m = fyLabel.match(/(\d{4})/);
  const year = m ? parseInt(m[1], 10) : new Date().getFullYear();
  return `${year}-12-31`;
}

export function computePeriodStart(fyLabel: string, customStart?: string): string {
  if (customStart) return customStart;
  const m = fyLabel.match(/(\d{4})/);
  const year = m ? parseInt(m[1], 10) : new Date().getFullYear();
  return `${year}-01-01`;
}

/** Run a quick health check on the period data before filing. */
export interface CtFilingReadiness {
  ready: boolean;
  warnings: string[];
  errors: string[];
}

export function checkFilingReadiness(period: UaeCtPeriod): CtFilingReadiness {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (period.revenue === 0) warnings.push('لم يتم تسجيل إيرادات للفترة');
  if (period.revenue > 3_000_000 && period.small_business_relief) errors.push('Small Business Relief غير متاح — الإيرادات تتجاوز 3 مليون درهم');
  if (period.entity_type === 'free_zone_qualifying' && period.qualifying_income + period.exempt_income > period.revenue) errors.push('الدخل المؤهل والمعفى يتجاوز الإيرادات');
  if (period.tax_due < 0) errors.push('الضريبة المستحقة لا يمكن أن تكون سالبة');
  if (period.status === 'open') errors.push('الفترة في حالة مفتوحة — يجب إكمالها قبل الإيداع');
  if (period.filed_at) errors.push('تم إيداع هذه الفترة بالفعل');
  return { ready: errors.length === 0, warnings, errors };
}

/** Aggregate ledger entries into a single set of CT values. */
export function aggregateLedger(entries: UaeCtLedgerEntry[]): Omit<CtComputationInput, 'entityType' | 'claimSmallBusinessRelief'> {
  let revenue = 0;
  let qualifyingIncome = 0;
  let exemptIncome = 0;
  let deductibleExpenses = 0;
  let nonDeductibleExpenses = 0;
  let transferPricingAdjustment = 0;
  let nonQualifyingIncome = 0;
  for (const e of entries) {
    switch (e.category) {
      case 'revenue': revenue += e.amount; break;
      case 'qualifying_income': qualifyingIncome += e.amount; break;
      case 'exempt_income': exemptIncome += e.amount; break;
      case 'deductible': deductibleExpenses += e.amount; break;
      case 'non_deductible': nonDeductibleExpenses += e.amount; break;
      case 'transfer_pricing': transferPricingAdjustment += e.amount; break;
    }
  }
  // Non-qualifying income = revenue - qualifying - exempt
  nonQualifyingIncome = Math.max(0, revenue - qualifyingIncome - exemptIncome);
  return {
    revenue: round2(revenue),
    qualifyingIncome: round2(qualifyingIncome),
    nonQualifyingIncome: round2(nonQualifyingIncome),
    exemptIncome: round2(exemptIncome),
    deductibleExpenses: round2(deductibleExpenses),
    nonDeductibleExpenses: round2(nonDeductibleExpenses),
    transferPricingAdjustment: round2(transferPricingAdjustment),
  };
}
