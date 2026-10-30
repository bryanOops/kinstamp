export type ReceiptNumberResult = { ok: true; value: string } | { ok: false; error: "invalid_receipt" };

/** Normalizes a receipt number as people type it (spaces, dashes, lowercase). */
export function parseReceiptNumber(input: string): ReceiptNumberResult {
  const value = input.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z]{3}[0-9]{10}$/.test(value) ? { ok: true, value } : { ok: false, error: "invalid_receipt" };
}
