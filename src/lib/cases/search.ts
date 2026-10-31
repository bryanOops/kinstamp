import { normalizeReceiptNumber } from "@/lib/format/receipt";

/** The few fields of a tracked case the list search looks at. Built on the server, nothing else is sent. */
export type CaseSearchable = {
  nickname: string | null;
  receiptNumber: string;
  statusEn: string | null;
  statusEs: string | null;
  formType: string | null;
};

/** Lowercase, accent-free (NFD + strip combining marks), trimmed. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Whether a case matches a free-text query. Case- and accent-insensitive; every word of the
 * query must match somewhere (nickname, status in either language or form type), and the whole
 * query, with spaces and dashes removed, is also tried against the receipt number so
 * "eac 999 910 3403" finds `EAC9999103403`. A blank query matches everything.
 */
export function matchesCaseQuery(query: string, searchable: CaseSearchable): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const receipt = searchable.receiptNumber.toUpperCase();
  if (receipt.includes(normalizeReceiptNumber(query))) return true;

  const haystack = [searchable.nickname, searchable.statusEn, searchable.statusEs, searchable.formType]
    .filter((v): v is string => Boolean(v))
    .map(fold);
  return words.every((word) => haystack.some((text) => text.includes(word)) || receipt.includes(normalizeReceiptNumber(word)));
}
