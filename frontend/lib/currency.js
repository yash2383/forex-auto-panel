export const CURRENCY = "$";

export const formatMoney = (amount) => {
  return `${CURRENCY}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
