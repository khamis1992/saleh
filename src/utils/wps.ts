// WPS — Wage Protection System (UAE)
// MOHRE / Salary Information File (SIF) generation
// Reference: MOHRE WPS Specification v3.0
//
// File format: fixed-length pipe-delimited text file (UTF-8)
// Header (1 row) + Detail (1 per employee)
// Required for all UAE establishments with 100+ employees
// Monthly submission via https://www.wps.mohre.gov.ae

import type { WpsSalaryItem, WpsFile } from '@/types';

export const WPS_CONFIG = {
  country: 'AE',
  authority: 'MOHRE',
  portal: 'WPS',
  url: 'https://www.wps.mohre.gov.ae',
  delimiter: '|',
  fileExtension: '.sif',
  recordSeparator: '\r\n',
  dateFormat: 'DD/MM/YYYY',                 // 25/06/2026
  amountFormat: '0.00',                    // 12345.67 (no thousands)
  headerFields: [
    'SIF_TYPE', 'SIF_VERSION', 'MOHRE_REF', 'ESTABLISHMENT_NAME', 'ESTABLISHMENT_MOL',
    'PAYROLL_MONTH', 'BANK_CODE', 'SALARY_DATE', 'TOTAL_AMOUNT', 'EMPLOYEE_COUNT', 'GENERATED_AT',
  ],
  detailFields: [
    'EMPLOYEE_ID', 'EMPLOYEE_NAME', 'LABOUR_CARD_NO', 'BANK_ROUTING', 'IBAN',
    'BASIC', 'HOUSING', 'TRANSPORT', 'OTHER_ALLOW', 'OVERTIME', 'DEDUCTIONS', 'NET',
    'DAYS_WORKED', 'LEAVE_DAYS',
  ],
} as const;

const pad2 = (n: number) => n.toString().padStart(2, '0');
const padR = (s: string, n: number) => (s || '').padEnd(n).slice(0, n);

export function formatWpsDate(isoDate: string): string {
  // YYYY-MM-DD → DD/MM/YYYY
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function formatWpsAmount(amount: number): string {
  // No thousand separator, 2 decimals
  return amount.toFixed(2);
}

/** Build a single SIF row for the header. */
export function buildSifHeader(file: Omit<WpsFile, 'sif_content'>): string {
  const fields = [
    'SAL',                                              // SIF_TYPE
    '3.0',                                              // SIF_VERSION
    file.mol_id,                                        // MOHRE_REF
    padR('REAL ESTATE DEVELOPMENT CO.', 50),            // ESTABLISHMENT_NAME (50 chars)
    file.mol_id,                                        // ESTABLISHMENT_MOL
    file.period_month,                                  // PAYROLL_MONTH (YYYY-MM)
    'NBF',                                              // BANK_CODE
    formatWpsDate(file.submitted_at?.split('T')[0] || '2026-06-25'),
    formatWpsAmount(file.total_net),
    String(file.employee_count),
    file.generated_at,
  ];
  return fields.join(WPS_CONFIG.delimiter);
}

/** Build a single SIF row for an employee. */
export function buildSifRow(item: WpsSalaryItem): string {
  const fields = [
    item.employee_id,
    padR(item.employee_name, 50),
    item.labor_id,
    item.bank_code,
    item.iban,
    formatWpsAmount(item.basic_salary),
    formatWpsAmount(item.housing_allowance),
    formatWpsAmount(item.transport_allowance),
    formatWpsAmount(item.other_allowances),
    formatWpsAmount(item.overtime),
    formatWpsAmount(item.deductions),
    formatWpsAmount(item.net_salary),
    String(item.days_worked),
    String(item.leave_days),
  ];
  return fields.join(WPS_CONFIG.delimiter);
}

/** Build the full SIF file content from a header config and employee rows. */
export function buildSifFile(file: WpsFile): string {
  const header = buildSifHeader(file);
  // Detail rows are stored as JSON in sif_content if it's a multi-row file
  // For simplicity we keep sif_content as the header + JSON body
  const body = (file as any)._rows as WpsSalaryItem[] | undefined;
  if (body) {
    const rows = body.map(buildSifRow).join(WPS_CONFIG.recordSeparator);
    return header + WPS_CONFIG.recordSeparator + rows + WPS_CONFIG.recordSeparator;
  }
  return header + WPS_CONFIG.recordSeparator;
}

export interface WpsEmployeeInput {
  employee_id: string;
  employee_name: string;
  labor_id: string;
  bank_code: string;
  iban: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  overtime: number;
  deductions: number;
  days_worked: number;
  leave_days: number;
}

export function buildWpsSalaryItem(input: WpsEmployeeInput): WpsSalaryItem {
  const net = round2(
    input.basic_salary +
    input.housing_allowance +
    input.transport_allowance +
    input.other_allowances +
    input.overtime -
    input.deductions,
  );
  return {
    id: `wps-emp-${input.employee_id}-${Date.now().toString(36)}`,
    employee_id: input.employee_id,
    employee_name: input.employee_name,
    labor_id: input.labor_id,
    bank_code: input.bank_code,
    iban: input.iban,
    basic_salary: round2(input.basic_salary),
    housing_allowance: round2(input.housing_allowance),
    transport_allowance: round2(input.transport_allowance),
    other_allowances: round2(input.other_allowances),
    overtime: round2(input.overtime),
    deductions: round2(input.deductions),
    net_salary: net,
    days_worked: input.days_worked,
    leave_days: input.leave_days,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Compute totals for a list of salary items. */
export function computeWpsTotals(items: WpsSalaryItem[]): {
  employee_count: number;
  total_basic: number;
  total_allowances: number;
  total_overtime: number;
  total_deductions: number;
  total_net: number;
} {
  const totals = items.reduce(
    (acc, i) => {
      acc.total_basic += i.basic_salary;
      acc.total_allowances += i.housing_allowance + i.transport_allowance + i.other_allowances;
      acc.total_overtime += i.overtime;
      acc.total_deductions += i.deductions;
      acc.total_net += i.net_salary;
      return acc;
    },
    { total_basic: 0, total_allowances: 0, total_overtime: 0, total_deductions: 0, total_net: 0 },
  );
  return {
    employee_count: items.length,
    total_basic: round2(totals.total_basic),
    total_allowances: round2(totals.total_allowances),
    total_overtime: round2(totals.total_overtime),
    total_deductions: round2(totals.total_deductions),
    total_net: round2(totals.total_net),
  };
}

/** Validate a SIF file before submission. */
export interface WpsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSifFile(items: WpsSalaryItem[]): WpsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (items.length === 0) {
    errors.push('لا يوجد موظفين في الملف');
  }
  for (const item of items) {
    if (!item.labor_id || !/^\d{6,}$/.test(item.labor_id)) {
      errors.push(`رقم بطاقة العمل غير صالح: ${item.employee_name}`);
    }
    if (!item.iban || !/^AE\d{21}$/.test(item.iban.replace(/\s/g, ''))) {
      errors.push(`IBAN غير صالح: ${item.employee_name} (يجب AE + 21 رقم)`);
    }
    if (item.net_salary <= 0) {
      warnings.push(`الراتب الصافي صفر أو سالب: ${item.employee_name}`);
    }
    if (item.days_worked === 0) {
      warnings.push(`لم يتم تسجيل أيام عمل: ${item.employee_name}`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

/** UAE bank routing codes (commonly used). */
export const UAE_BANK_CODES: Array<{ code: string; name_ar: string; name_en: string }> = [
  { code: 'NBF', name_ar: 'بنك الإمارات دبي الوطني', name_en: 'Emirates NBD' },
  { code: 'ABD', name_ar: 'بنك أبوظبي الأول', name_en: 'FAB' },
  { code: 'DIB', name_ar: 'بنك دبي الإسلامي', name_en: 'Dubai Islamic Bank' },
  { code: 'ADCB', name_ar: 'بنك أبوظبي التجاري', name_en: 'ADCB' },
  { code: 'MASH', name_ar: 'بنك المشرق', name_en: 'Mashreq' },
  { code: 'CBD', name_ar: 'بنك الخليج التجاري', name_en: 'CBD' },
  { code: 'RAK', name_ar: 'بنك رأس الخيمة الوطني', name_en: 'RAKBank' },
  { code: 'HSBC', name_ar: 'إتش إس بي سي', name_en: 'HSBC' },
];

/** Period label for a YYYY-MM string. */
export function wpsPeriodLabel(month: string): string {
  const [y, m] = month.split('-');
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

/** Salary date: last day of the period month + 7 days grace (MOHRE rule). */
export function defaultWpsSalaryDate(month: string): string {
  const [y, m] = month.split('-');
  const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
  return `${y}-${pad2(parseInt(m, 10))}-${pad2(lastDay)}`;
}
