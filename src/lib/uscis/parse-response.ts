import { z } from "zod";
import { easternOffsetMinutes } from "@/lib/time";

/** What Kinstamp keeps from one USCIS case status response. */
export type CaseSnapshot = {
  receiptNumber: string;
  formType: string | null;
  /** ISO timestamps; USCIS omits them for IOE receipt numbers. */
  submittedAt: string | null;
  uscisModifiedAt: string | null;
  status: { en: string; es: string | null };
  description: { en: string | null; es: string | null };
  /** USCIS's own history, as listed in `hist_case_status`. */
  history: { date: string; en: string; es: string | null }[];
};

export type ParseResult = { ok: true; snapshot: CaseSnapshot } | { ok: false; error: "unexpected_response" };

const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value?.trim() ? value.trim() : null));

const responseSchema = z.object({
  case_status: z.object({
    receiptNumber: z.string(),
    formType: optionalText,
    submittedDate: optionalText,
    modifiedDate: optionalText,
    current_case_status_text_en: z.string().trim().min(1),
    current_case_status_desc_en: optionalText,
    current_case_status_text_es: optionalText,
    current_case_status_desc_es: optionalText,
    hist_case_status: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          completed_text_en: z.string().trim().min(1),
          completed_text_es: optionalText,
        }),
      )
      .nullish(),
  }),
});

export function parseCaseStatusResponse(body: unknown): ParseResult {
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: "unexpected_response" };
  const c = parsed.data.case_status;

  return {
    ok: true,
    snapshot: {
      receiptNumber: c.receiptNumber,
      formType: c.formType,
      submittedAt: easternDateTimeToIso(c.submittedDate),
      uscisModifiedAt: easternDateTimeToIso(c.modifiedDate),
      status: { en: c.current_case_status_text_en, es: c.current_case_status_text_es },
      description: { en: c.current_case_status_desc_en, es: c.current_case_status_desc_es },
      history: (c.hist_case_status ?? []).map((entry) => ({
        date: entry.date,
        en: entry.completed_text_en,
        es: entry.completed_text_es,
      })),
    },
  };
}

/**
 * USCIS sends `MM-DD-YYYY HH:mm:ss` without a time zone. We read it as US Eastern
 * time (where USCIS operates), so daylight saving time is applied correctly.
 */
function easternDateTimeToIso(value: string | null): string | null {
  const match = value?.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match.map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(asUtc - easternOffsetMinutes(new Date(asUtc)) * 60_000).toISOString();
}
