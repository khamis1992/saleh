// GOSI — General Organization for Social Insurance (Saudi Arabia)
// Reference: GOSI Online Submission Specification
//
// Contribution rates (2024/2025):
//   Saudi employees:
//     - Pension (SANED — Branch 1): Employee 9% + Employer 9% = 18% (on contributory wage)
//     - Occupational Hazards (Branch 2): Employer 2% (no employee share)
//   Non-Saudi employees:
//     - Occupational Hazards only: Employer 2%
//
// Contributory wage = (Basic + Housing) capped at SAR 9,000 (i.e. max contribution = SAR 9,000 × 18% = SAR 1,620)

import type { GosiContribution, GosiSubscriberType } from '@/types';

export const GOSI_CONFIG = {
  country: 'SA',
  authority: 'GOSI',
  portal: 'GOSI Online',
  url: 'https://www.gosi.gov.sa',
  monthlyWageCap: 9000,            // SAR — max contributory wage

  saudi: {
    employeePension: 0.09,         // 9% employee
    employerPension: 0.09,         // 9% employer
    employerSaned: 0.02,           // 2% employer
    totalEmployee: 0.09,
    totalEmployer: 0.11,           // 9 + 2
  },

  nonSaudi: {
    employeePension: 0,
    employerPension: 0,
    employerSaned: 0.02,           // 2% employer
    totalEmployee: 0,
    totalEmployer: 0.02,
  },
} as const;

export interface GosiCalculationInput {
  subscriber_type: GosiSubscriberType;
  basic_salary: number;
  housing_allowance: number;
  gross_salary: number;
}

export interface GosiCalculationOutput {
  contributory_wage: number;            // min(9000, basic + housing)
  employee_pension: number;             // SAR
  employer_pension: number;             // SAR
  employer_saned: number;               // SAR (occupational hazards)
  total_employee_share: number;         // SAR
  total_employer_share: number;         // SAR
  total_contribution: number;           // SAR
  is_capped: boolean;                   // contributory wage capped at 9000
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateGosi(input: GosiCalculationInput): GosiCalculationOutput {
  const contributoryWage = round2(Math.min(GOSI_CONFIG.monthlyWageCap, input.basic_salary + input.housing_allowance));
  const isCapped = (input.basic_salary + input.housing_allowance) > GOSI_CONFIG.monthlyWageCap;

  const cfg = input.subscriber_type === 'saudi' ? GOSI_CONFIG.saudi : GOSI_CONFIG.nonSaudi;
  const employeePension = round2(contributoryWage * cfg.employeePension);
  const employerPension = round2(contributoryWage * cfg.employerPension);
  const employerSaned = round2(contributoryWage * cfg.employerSaned);
  const totalEmployee = round2(employeePension);
  const totalEmployer = round2(employerPension + employerSaned);
  const total = round2(totalEmployee + totalEmployer);

  return {
    contributory_wage: contributoryWage,
    employee_pension: employeePension,
    employer_pension: employerPension,
    employer_saned: employerSaned,
    total_employee_share: totalEmployee,
    total_employer_share: totalEmployer,
    total_contribution: total,
    is_capped: isCapped,
  };
}

export function buildGosiContribution(
  input: {
    company_id: string;
    subscriber_type: GosiSubscriberType;
    subscriber_id: string;
    subscriber_name: string;
    nationality: string;
    basic_salary: number;
    housing_allowance: number;
    gross_salary: number;
    notes: string;
  },
): GosiContribution {
  const calc = calculateGosi(input);
  const cfg = input.subscriber_type === 'saudi' ? GOSI_CONFIG.saudi : GOSI_CONFIG.nonSaudi;
  return {
    id: `gosi-${input.subscriber_id}-${Date.now().toString(36)}`,
    company_id: input.company_id,
    subscriber_type: input.subscriber_type,
    subscriber_id: input.subscriber_id,
    subscriber_name: input.subscriber_name,
    nationality: input.nationality,
    gross_salary: round2(input.gross_salary),
    basic_salary: round2(input.basic_salary),
    housing_allowance: round2(input.housing_allowance),
    monthly_wage: calc.contributory_wage,
    pension_rate: cfg.totalEmployee,
    saned_rate: cfg.employerSaned,
    employer_total_rate: cfg.totalEmployer,
    notes: input.notes,
  };
}

/** Aggregate contributions into filing totals. */
export interface GosiFilingTotals {
  employee_count: number;
  total_employee_share: number;
  total_employer_share: number;
  total_saned: number;
  total_contributions: number;
}

export function computeGosiTotals(contributions: GosiContribution[]): GosiFilingTotals {
  const result = contributions.reduce(
    (acc, c) => {
      acc.total_employee_share += c.monthly_wage! * c.pension_rate!;
      acc.total_employer_share += c.monthly_wage! * c.employer_total_rate!;
      acc.total_saned += c.monthly_wage! * c.saned_rate!;
      return acc;
    },
    { total_employee_share: 0, total_employer_share: 0, total_saned: 0, total_contributions: 0 },
  );
  return {
    employee_count: contributions.length,
    total_employee_share: round2(result.total_employee_share),
    total_employer_share: round2(result.total_employer_share),
    total_saned: round2(result.total_saned),
    total_contributions: round2(result.total_employee_share + result.total_employer_share),
  };
}

/** Build the GOSI Online XML submission payload. */
export interface GosiSubmissionXml {
  header: {
    establishment_id: string;
    period_month: string;
    submission_type: 'online' | 'amendment';
    generated_at: string;
  };
  rows: Array<{
    subscriber_id: string;
    subscriber_name: string;
    nationality: string;
    subscriber_type: GosiSubscriberType;
    basic_salary: number;
    housing_allowance: number;
    contributory_wage: number;
    employee_share: number;
    employer_share: number;
    saned: number;
  }>;
  total_employee_share: number;
  total_employer_share: number;
  total_saned: number;
  grand_total: number;
}

export function buildGosiSubmissionXml(
  companyId: string,
  periodMonth: string,
  contributions: GosiContribution[],
): GosiSubmissionXml {
  const rows = contributions.map(c => {
    const calc = calculateGosi({
      subscriber_type: c.subscriber_type!,
      basic_salary: c.basic_salary!,
      housing_allowance: c.housing_allowance!,
      gross_salary: c.gross_salary!,
    });
    return {
      subscriber_id: c.subscriber_id,
      subscriber_name: c.subscriber_name,
      nationality: c.nationality,
      subscriber_type: c.subscriber_type,
      basic_salary: c.basic_salary,
      housing_allowance: c.housing_allowance,
      contributory_wage: calc.contributory_wage,
      employee_share: calc.total_employee_share,
      employer_share: calc.total_employer_share,
      saned: calc.employer_saned,
    };
  });
  const totals = computeGosiTotals(contributions);
  return {
    header: {
      establishment_id: companyId,
      period_month: periodMonth,
      submission_type: 'online',
      generated_at: new Date().toISOString(),
    },
    rows: rows as any,
    total_employee_share: totals.total_employee_share,
    total_employer_share: totals.total_employer_share,
    total_saned: totals.total_saned,
    grand_total: totals.total_contributions,
  };
}

export function gosiPeriodLabel(month: string): string {
  const [y, m] = month.split('-');
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}
