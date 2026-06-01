// QAR (Qatari Riyal) formatting utilities
// Uses Intl.NumberFormat — no external dependencies needed
// QAR format: 1,234,567.89 ر.ق  (English numerals, comma thousands, dot decimal)

const QAR_CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'QAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const QAR_CURRENCY_INT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'QAR',
  maximumFractionDigits: 0,
});

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const NUMBER_DECIMAL = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AREA_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Format a number as QAR currency with 2 decimal places
 * @example formatQAR(1234567.89) => "QAR 1,234,567.89"
 */
export function formatQAR(value: number): string {
  return QAR_CURRENCY.format(value);
}

/**
 * Format a number as QAR currency without decimals (whole riyals)
 * @example formatQARInt(1234567) => "QAR 1,234,567"
 */
export function formatQARInt(value: number): string {
  return QAR_CURRENCY_INT.format(value);
}

/**
 * Format a plain number with thousand separators (no decimals)
 * @example formatThousand(1234567) => "1,234,567"
 */
export function formatThousand(value: number): string {
  return NUMBER_FORMAT.format(value);
}

/**
 * Format a number with 2 decimal places and thousand separators
 * @example formatDecimal(1234567.89) => "1,234,567.89"
 */
export function formatDecimal(value: number): string {
  return NUMBER_DECIMAL.format(value);
}

/**
 * Format a percentage value
 * @example formatPercent(0.856) => "85.6%"
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format square meters with m² suffix
 * @example formatArea(1234.5) => "1,234.5 م²"
 */
export function formatArea(value: number): string {
  return `${AREA_FORMAT.format(value)} م²`;
}

/**
 * Format a number compactly (1.2K, 3.4M, etc.)
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Parse a QAR string back to number (handles "QAR 1,234.56")
 */
export function parseQAR(value: string): number {
  return Number(value.replace(/[^\d.-]/g, ''));
}
