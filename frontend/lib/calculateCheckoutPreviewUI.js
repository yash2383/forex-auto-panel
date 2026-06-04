/**
 * calculateCheckoutPreviewUI.js
 *
 * Unified preview pricing calculation logic specifically for checkout UI rendering.
 * NOTE: This is for UI preview displays only and is NOT authoritative for payments.
 *
 * Business rules (all configurable per plan):
 *   - plan.amount       → base entry fee (FIXED plans). null for FLEXIBLE plans.
 *   - plan.weeklyProfit → platform profit-share percentage
 *
 * For FIXED plans:
 *   totalPayable = plan.amount (entry fee; no markup added at checkout)
 *
 * For FLEXIBLE plans:
 *   User enters their own deposit amount (previewAmount).
 *   We show:  previewAmount  (what they pay)
 *   We earn:  weeklyProfit%  deducted from future profits (not charged upfront at checkout).
 *
 * @param {object} plan           - Plan object from the database
 * @param {number} previewAmount  - User-entered preview amount (for FLEXIBLE plans)
 * @returns {object}
 */
export function calculateCheckoutPreviewUI(plan, previewAmount = 0) {
  const isFlexible = plan.pricingType === "FLEXIBLE" || plan.amount == null;
  const base = isFlexible ? Number(previewAmount) || 0 : Number(plan.amount) || 0;
  const profitFeePercent = Number(plan.weeklyProfit) || 0;

  const entryFee = base;
  const platformFeeNote = profitFeePercent > 0
    ? `${profitFeePercent}% deducted from profits per cycle`
    : null;

  return {
    isFlexible,
    baseAmount: base,
    entryFee,
    profitFeePercent,
    platformFeeNote,
    currency: "USDT",
  };
}
