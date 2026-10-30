/** Groups a receipt number for reading: `EAC9999103403` -> `EAC 999 910 3403`. */
export function groupReceiptNumber(receipt: string): string {
  const normalized = receipt.replace(/[\s-]/g, "").toUpperCase();
  const match = /^([A-Z]{3})(\d{3})(\d{3})(\d{4})$/.exec(normalized);
  if (!match) return normalized;
  const [, prefix, a, b, c] = match;
  return `${prefix} ${a} ${b} ${c}`;
}

/** Strips spaces and dashes and uppercases, the same normalization the server applies. */
export function normalizeReceiptNumber(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export const receiptNumberPattern = /^[A-Z]{3}\d{10}$/;

export function isReceiptNumber(value: string): boolean {
  return receiptNumberPattern.test(normalizeReceiptNumber(value));
}
