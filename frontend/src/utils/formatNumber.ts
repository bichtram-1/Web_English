/**
 * Utility functions for formatting numbers into compact / localized readable strings.
 */

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const fullNumberFormatter = new Intl.NumberFormat('en-US');

/**
 * Format a number into compact format (e.g. 950, 1.2K, 10K, 1.5M, 1B)
 * Following standard notation:
 * - < 1,000: raw number (e.g. 128)
 * - >= 1,000: K (e.g. 1.2K)
 * - >= 1,000,000: M (e.g. 2.5M)
 * - >= 1,000,000,000: B (e.g. 1B)
 */
export function formatCompactNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return compactFormatter.format(num);
}

/**
 * Format number with comma separators for tooltip or detailed display (e.g. 1,000,000,000)
 */
export function formatFullNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return fullNumberFormatter.format(num);
}
