/**
 * platform-fee.util.ts
 * Shared utility for dynamic platform fee calculations.
 */

export function getPlatformFeePercent(
  planType: 'INDIVIDUAL' | 'CLUB' | string | null | undefined,
  amount: number,
): number {
  const normalizedType = planType ? planType.toUpperCase() : '';
  if (normalizedType.includes('INDIVIDUAL')) {
    return amount >= 10000 ? 4 : 5;
  }

  if (normalizedType.includes('CLUB')) {
    return amount > 100 ? 4 : 5;
  }

  return 5;
}
