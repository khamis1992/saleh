// VAT (Value Added Tax) calculations for MENA/GCC countries
// Each country has its own VAT rate and applicability rules

export type Country = 'QA' | 'AE' | 'SA' | 'BH' | 'KW' | 'OM';

export interface VATConfig {
  rate: number; // percentage as decimal (0.05 = 5%)
  label: string; // Arabic label
  appliesToRent: boolean; // GCC standard — rent is exempt in most
  appliesToSale: boolean;
  appliesToServices: boolean;
}

export const VAT_CONFIGS: Record<Country, VATConfig> = {
  QA: { rate: 0, label: 'قطر', appliesToRent: false, appliesToSale: false, appliesToServices: false },
  AE: { rate: 0.05, label: 'الإمارات', appliesToRent: true, appliesToSale: true, appliesToServices: true },
  SA: { rate: 0.15, label: 'السعودية', appliesToRent: true, appliesToSale: true, appliesToServices: true },
  BH: { rate: 0.10, label: 'البحرين', appliesToRent: true, appliesToSale: true, appliesToServices: true },
  KW: { rate: 0, label: 'الكويت', appliesToRent: false, appliesToSale: false, appliesToServices: false },
  OM: { rate: 0.05, label: 'عُمان', appliesToRent: true, appliesToSale: true, appliesToServices: true },
};

export type TransactionType = 'rent' | 'sale' | 'service' | 'other';

/**
 * Compute VAT for a given amount.
 * @param amount - base amount in QAR
 * @param country - ISO country code
 * @param inclusive - if true, the amount includes VAT (returns VAT portion); if false, returns VAT to add
 * @param type - transaction type
 */
export function computeVAT(
  amount: number,
  country: Country,
  inclusive: boolean = false,
  type: TransactionType = 'rent',
): { base: number; vat: number; total: number; rate: number } {
  const config = VAT_CONFIGS[country];
  if (!isVATApplicable(country, type)) {
    return { base: amount, vat: 0, total: amount, rate: 0 };
  }
  const rate = config.rate;
  if (inclusive) {
    const base = amount / (1 + rate);
    const vat = amount - base;
    return { base, vat, total: amount, rate };
  } else {
    const vat = amount * rate;
    return { base: amount, vat, total: amount + vat, rate };
  }
}

/**
 * Compute VAT breakdown for a list of line items.
 */
export function computeVATBreakdown(
  items: { amount: number; type: TransactionType; description?: string }[],
  country: Country,
  inclusive: boolean = false,
): {
  totalBase: number;
  totalVAT: number;
  totalGross: number;
  effectiveRate: number;
  byType: Record<TransactionType, { base: number; vat: number; count: number }>;
} {
  const byType: Record<TransactionType, { base: number; vat: number; count: number }> = {
    rent: { base: 0, vat: 0, count: 0 },
    sale: { base: 0, vat: 0, count: 0 },
    service: { base: 0, vat: 0, count: 0 },
    other: { base: 0, vat: 0, count: 0 },
  };
  let totalBase = 0;
  let totalVAT = 0;
  for (const item of items) {
    const r = computeVAT(item.amount, country, inclusive, item.type);
    totalBase += r.base;
    totalVAT += r.vat;
    byType[item.type].base += r.base;
    byType[item.type].vat += r.vat;
    byType[item.type].count += 1;
  }
  const totalGross = totalBase + totalVAT;
  const effectiveRate = totalBase > 0 ? totalVAT / totalBase : 0;
  return { totalBase, totalVAT, totalGross, effectiveRate, byType };
}

/**
 * Format VAT rate as a percentage string.
 */
export function formatVATRate(country: Country): string {
  const rate = VAT_CONFIGS[country].rate;
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Check if VAT applies to a given transaction type in a country.
 */
export function isVATApplicable(country: Country, type: TransactionType): boolean {
  const config = VAT_CONFIGS[country];
  switch (type) {
    case 'rent': return config.appliesToRent;
    case 'sale': return config.appliesToSale;
    case 'service': return config.appliesToServices;
    default: return false;
  }
}

/**
 * List countries that currently apply VAT (rate > 0).
 */
export function getVATCountries(): Country[] {
  return (Object.keys(VAT_CONFIGS) as Country[]).filter(c => VAT_CONFIGS[c].rate > 0);
}
