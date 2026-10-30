import "server-only";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { officialProcessingTimeFor } from "@/lib/processing-times/official";
import { getTrackedCaseDetail, listInsights, type TrackedCaseDetail } from "@/server/cases/queries";
import { noticePlainText } from "@/lib/uscis/notice-text";

const plain = (text: string | null) => (text ? noticePlainText(text) : text);

/**
 * Read-only tools for one tracked case. Every query runs as the signed-in person
 * (RLS), so the assistant can never see more than the person already can.
 */
export function caseAssistantTools(trackedCaseId: string) {
  let detail: Promise<TrackedCaseDetail | null> | null = null;
  const loadCase = () => (detail ??= getTrackedCaseDetail(trackedCaseId));
  const noInput = z.object({});

  return [
    betaZodTool({
      name: "get_case_overview",
      description:
        "The case's receipt number, form type, current USCIS status (English and Spanish) with its official description, when it was submitted, and when Kinstamp last checked USCIS.",
      inputSchema: noInput,
      run: async () => {
        const c = await loadCase();
        if (!c) return "Case not found or not accessible.";
        return JSON.stringify({
          nickname: c.nickname,
          receiptNumber: c.case.receiptNumber,
          formType: c.case.formType,
          status: { en: c.case.statusEn, es: c.case.statusEs },
          description: { en: plain(c.case.descriptionEn), es: plain(c.case.descriptionEs) },
          statusCategory: c.case.category,
          submittedAt: c.case.submittedAt,
          lastSuccessfulCheckAt: c.case.lastSuccessfulCheckAt,
          checkState: c.case.checkState,
          lastCheckError: c.case.lastErrorCode,
        });
      },
    }),
    betaZodTool({
      name: "get_timeline",
      description:
        "Every status event of the case in date order. origin 'reported' = listed in USCIS's own history; 'observed' = detected by Kinstamp when it checked.",
      inputSchema: noInput,
      run: async () => {
        const c = await loadCase();
        if (!c) return "Case not found or not accessible.";
        return JSON.stringify(
          c.timeline.map((e) => ({ date: e.occurredOn, origin: e.origin, category: e.category, textEn: e.textEn, textEs: e.textEs })),
        );
      },
    }),
    betaZodTool({
      name: "get_key_dates",
      description: "Due dates and appointments the family or their attorney copied from USCIS notices for this case.",
      inputSchema: noInput,
      run: async () => {
        const c = await loadCase();
        if (!c) return "Case not found or not accessible.";
        return JSON.stringify(c.keyDates.map((k) => ({ kind: k.kind, date: k.date, time: k.time, title: k.title, notes: k.notes })));
      },
    }),
    betaZodTool({
      name: "get_official_processing_time",
      description:
        "The processing time USCIS publishes for this case's form type (time within which USCIS completes 80% of cases), with its source and date. Returns null when Kinstamp has no figure for this form.",
      inputSchema: noInput,
      run: async () => {
        const c = await loadCase();
        if (!c?.case.formType) return JSON.stringify(null);
        return JSON.stringify(officialProcessingTimeFor(c.case.formType));
      },
    }),
    betaZodTool({
      name: "get_insights",
      description:
        "Anonymized durations (days from received to approved) from Kinstamp users who opted in, for this case's form type. Null when fewer than 5 cases exist.",
      inputSchema: noInput,
      run: async () => {
        const c = await loadCase();
        const insight = (await listInsights()).find((i) => i.formType === c?.case.formType);
        return JSON.stringify(insight ?? null);
      },
    }),
  ];
}
