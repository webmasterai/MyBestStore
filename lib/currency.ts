/**
 * Format amount as PKR currency.
 * Amounts are expected to be in major units (e.g. 11000 => "Rs 11,000").
 */
export function formatPKR(amount: string | number) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
