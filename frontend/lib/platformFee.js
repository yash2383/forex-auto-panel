/**
 * platformFee.js
 * Shared utility for dynamic platform fee calculations on the frontend.
 */

export function getPlatformFeePercent(planType, amount) {
  const normalizedType = planType ? planType.toUpperCase() : '';
  if (normalizedType.includes('INDIVIDUAL')) {
    return amount >= 10000 ? 4 : 5;
  }

  if (normalizedType.includes('CLUB')) {
    return amount > 100 ? 4 : 5;
  }

  return 5;
}
