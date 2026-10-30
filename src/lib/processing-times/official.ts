import { z } from "zod";
import raw from "@/data/official-processing-times.json";

/**
 * Official processing times published by USCIS, copied by hand into
 * `src/data/official-processing-times.json` with the source and the date they were read.
 * The file may hold no entries yet; the UI then shows nothing for "Is my case slow?".
 */
const entrySchema = z.object({
  formType: z.string().min(1),
  /** Months within which USCIS completes 80% of cases, as published. */
  months: z.number().positive(),
  /** Optional per-entry overrides when a figure was read on another day or page. */
  sourceUrl: z.url().optional(),
  retrievedOn: z.iso.date().optional(),
});

const fileSchema = z.object({
  source: z.url(),
  retrievedOn: z.iso.date().nullable(),
  note: z.string().optional(),
  entries: z.array(entrySchema),
});

export type OfficialProcessingTime = {
  formType: string;
  months: number;
  sourceUrl: string;
  /** `YYYY-MM-DD` when the figure was read from USCIS. */
  readOn: string;
};

const parsed = fileSchema.safeParse(raw);
const file = parsed.success ? parsed.data : null;

/** The published figure for a form type, or null when the file has none for it. */
export function officialProcessingTimeFor(formType: string | null | undefined): OfficialProcessingTime | null {
  if (!file || !formType) return null;
  const entry = file.entries.find((e) => e.formType.toUpperCase() === formType.toUpperCase());
  if (!entry) return null;
  const readOn = entry.retrievedOn ?? file.retrievedOn;
  if (!readOn) return null;
  return { formType: entry.formType, months: entry.months, sourceUrl: entry.sourceUrl ?? file.source, readOn };
}
