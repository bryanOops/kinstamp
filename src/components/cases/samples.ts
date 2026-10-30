import type { CaseDetail, TrackedCaseSummary } from "./types";

/**
 * Sample data for the /design gallery. Receipt numbers are USCIS sandbox test receipts
 * and status texts follow USCIS wording. Dates are fixed so the gallery is deterministic.
 */
export const sampleNow = new Date("2026-10-30T18:00:00Z");

export const sandboxReceipts = ["EAC9999103403", "LIN9999106498", "SRC9999102777", "EAC9999103402"] as const;

export const sampleTrackedCases: TrackedCaseSummary[] = [
  {
    trackedCaseId: "tc_1",
    receiptNumber: "EAC9999103403",
    nickname: "Mom's green card",
    formType: "I-130",
    status: { en: "Case Was Approved", es: "El caso fue aprobado" },
    statusCategory: "approved",
    checkState: "ok",
    lastChangeOn: "2026-10-28",
    lastSuccessfulCheckAt: "2026-10-30T17:50:00Z",
    changedSinceLastVisit: true,
    nextKeyDate: null,
  },
  {
    trackedCaseId: "tc_2",
    receiptNumber: "LIN9999106498",
    nickname: "Work permit",
    formType: "I-765",
    status: { en: "Request for Additional Evidence Was Sent", es: "Se envió una solicitud de evidencia adicional" },
    statusCategory: "evidence_requested",
    checkState: "ok",
    lastChangeOn: "2026-10-02",
    lastSuccessfulCheckAt: "2026-10-30T17:50:00Z",
    changedSinceLastVisit: false,
    nextKeyDate: { kind: "due_date", date: "2026-11-18", title: "RFE response due" },
  },
  {
    trackedCaseId: "tc_3",
    receiptNumber: "SRC9999102777",
    nickname: "Travel document",
    formType: "I-131",
    status: { en: "Case Was Received", es: "El caso fue recibido" },
    statusCategory: "received",
    checkState: "ok",
    lastChangeOn: "2026-08-14",
    lastSuccessfulCheckAt: "2026-10-29T15:05:00Z",
    changedSinceLastVisit: false,
    nextKeyDate: { kind: "appointment", date: "2026-11-03", title: "Biometrics appointment" },
  },
  {
    trackedCaseId: "tc_4",
    receiptNumber: "EAC9999103402",
    nickname: null,
    formType: null,
    status: null,
    statusCategory: null,
    checkState: "awaiting_first_check",
    lastChangeOn: null,
    lastSuccessfulCheckAt: null,
    changedSinceLastVisit: false,
    nextKeyDate: null,
  },
];

export const sampleCaseDetail: CaseDetail = {
  trackedCaseId: "tc_2",
  receiptNumber: "LIN9999106498",
  nickname: "Work permit",
  formType: "I-765",
  formTitle: { en: "Application for Employment Authorization", es: "Solicitud de autorización de empleo" },
  status: { en: "Request for Additional Evidence Was Sent", es: "Se envió una solicitud de evidencia adicional" },
  description: {
    en: "On October 2, 2026, we sent a request for additional evidence for your Form I-765, Application for Employment Authorization, Receipt Number LIN9999106498. The request explains what we need from you. We will not take action on your case until we receive the evidence or the deadline to submit it expires. Please follow the instructions in the request.",
    es: "El 2 de octubre de 2026 enviamos una solicitud de evidencia adicional para su Formulario I-765, Solicitud de autorización de empleo, número de recibo LIN9999106498. La solicitud explica lo que necesitamos de usted. No tomaremos ninguna acción sobre su caso hasta recibir la evidencia o hasta que venza el plazo. Siga las instrucciones de la solicitud.",
  },
  statusCategory: "evidence_requested",
  checkState: "ok",
  receivedOn: "2026-03-30",
  lastChangeOn: "2026-10-02",
  lastSuccessfulCheckAt: "2026-10-30T17:50:00Z",
  lastErrorCode: null,
  events: [
    {
      id: "ev_4",
      occurredOn: "2026-10-02",
      title: "Request for Additional Evidence Was Sent",
      titleEs: "Se envió una solicitud de evidencia adicional",
      description: "USCIS mailed a request for more evidence. The notice lists what to send and the deadline.",
      origin: "observed",
      category: "evidence_requested",
    },
    {
      id: "ev_3",
      occurredOn: "2026-06-11",
      title: "Case Is Being Actively Reviewed By USCIS",
      description: "An officer started reviewing the application.",
      origin: "reported",
      category: "other",
    },
    {
      id: "ev_2",
      occurredOn: "2026-04-22",
      title: "Fingerprint Fee Was Received",
      description: "The biometrics fee was recorded.",
      origin: "reported",
      category: "biometrics",
    },
    {
      id: "ev_1",
      occurredOn: "2026-03-30",
      title: "Case Was Received",
      titleEs: "El caso fue recibido",
      description: "USCIS received the application and sent a receipt notice.",
      origin: "reported",
      category: "received",
    },
  ],
  keyDates: [
    { id: "kd_1", kind: "due_date", date: "2026-11-18", time: null, title: "RFE response due", notes: "Send the employer letter and pay stubs.", canDelete: true },
    { id: "kd_2", kind: "appointment", date: "2026-12-04", time: "09:30", title: "Biometrics appointment", notes: null, canDelete: true },
  ],
  shares: [
    { id: "sh_1", attorneyEmail: "ana@lawfirm.com", status: "active", createdAt: "2026-10-12T10:00:00Z", revokedAt: null },
    { id: "sh_2", attorneyEmail: "luis@abogados.pe", status: "pending", createdAt: "2026-10-28T09:15:00Z", revokedAt: null },
    { id: "sh_3", attorneyEmail: "old@firm.com", status: "revoked", createdAt: "2026-05-01T09:15:00Z", revokedAt: "2026-09-20T16:00:00Z" },
  ],
  officialProcessingTime: { formType: "I-765", months: 5, sourceUrl: "https://egov.uscis.gov/processing-times/", readOn: "2026-10-20" },
  insight: { formType: "I-765", count: 48, medianDays: 118, p25Days: 76, p75Days: 162 },
};

export const sampleApprovedCase: CaseDetail = {
  ...sampleCaseDetail,
  trackedCaseId: "tc_1",
  receiptNumber: "EAC9999103403",
  nickname: "Mom's green card",
  formType: "I-130",
  formTitle: { en: "Petition for Alien Relative", es: "Petición para familiar extranjero" },
  status: { en: "Case Was Approved", es: "El caso fue aprobado" },
  description: {
    en: "On October 28, 2026, we approved your Form I-130, Petition for Alien Relative, Receipt Number EAC9999103403. We sent you an approval notice. Please follow the instructions in the notice.",
    es: "El 28 de octubre de 2026 aprobamos su Formulario I-130, Petición para familiar extranjero, número de recibo EAC9999103403. Le enviamos un aviso de aprobación. Siga las instrucciones del aviso.",
  },
  statusCategory: "approved",
  receivedOn: "2025-11-12",
  lastChangeOn: "2026-10-28",
  events: [
    { id: "ev_a4", occurredOn: "2026-10-28", title: "Case Was Approved", description: "An approval notice was mailed.", origin: "observed", category: "approved" },
    { id: "ev_a3", occurredOn: "2026-07-14", title: "Case Is Being Actively Reviewed By USCIS", description: null, origin: "reported", category: "other" },
    { id: "ev_a2", occurredOn: "2026-02-03", title: "Fingerprint Fee Was Received", description: null, origin: "reported", category: "biometrics" },
    { id: "ev_a1", occurredOn: "2025-11-12", title: "Case Was Received", description: "USCIS received the petition and sent a receipt notice.", origin: "reported", category: "received" },
  ],
  keyDates: [],
  shares: [{ id: "sh_a1", attorneyEmail: "ana@lawfirm.com", status: "active", createdAt: "2026-01-12T10:00:00Z", revokedAt: null }],
  officialProcessingTime: { formType: "I-130", months: 15, sourceUrl: "https://egov.uscis.gov/processing-times/", readOn: "2026-10-20" },
  insight: { formType: "I-130", count: 61, medianDays: 352, p25Days: 290, p75Days: 430 },
};

/** Offline state: last check failed because USCIS was unavailable. */
export const sampleOfflineCase: CaseDetail = {
  ...sampleCaseDetail,
  checkState: "error",
  lastErrorCode: "unavailable",
};
