/** Staging receipt numbers published on the Case Status API page (docs/uscis-api.md). */
export const sandboxReceiptsWithHistory = [
  "EAC9999103403", "EAC9999103404", "EAC9999103405", "EAC9999103410", "EAC9999103411", "EAC9999103416",
  "EAC9999103419", "LIN9999106498", "LIN9999106499", "LIN9999106504", "LIN9999106505", "LIN9999106506",
  "SRC9999102777", "SRC9999102778", "SRC9999102779", "SRC9999102780", "SRC9999102781", "SRC9999102782",
  "SRC9999102783", "SRC9999102784", "SRC9999102785", "SRC9999102786", "SRC9999102787", "SRC9999132710",
  "SRC9999132719",
] as const;

export const sandboxReceiptsWithoutHistory = [
  "EAC9999103400", "EAC9999103402", "EAC9999103406", "EAC9999103407", "EAC9999103408", "EAC9999103409",
  "EAC9999103412", "EAC9999103413", "EAC9999103414", "EAC9999103415", "EAC9999103420", "EAC9999103421",
  "EAC9999103424", "EAC9999103425", "EAC9999103426", "EAC9999103428", "EAC9999103429", "EAC9999103431",
  "EAC9999103432", "LIN9999106501", "LIN9999106507", "SRC9999132694", "SRC9999132695", "SRC9999132706",
  "SRC9999132707",
] as const;

export const sandboxReceiptNumbers: readonly string[] = [...sandboxReceiptsWithHistory, ...sandboxReceiptsWithoutHistory];

/**
 * A varied subset offered in the "Add a case" dialog, one per interesting status.
 * `label` is an i18n key under `cases.add.sandbox.samples`; statuses come from the recordings.
 */
export const sandboxShowcase = [
  { receipt: "LIN9999106498", label: "approvedWithHistory" },
  { receipt: "LIN9999106501", label: "received" },
  { receipt: "EAC9999103424", label: "intentToRevoke" },
  { receipt: "EAC9999103408", label: "cardMailed" },
  { receipt: "EAC9999103409", label: "cardDelivered" },
  { receipt: "EAC9999103414", label: "cardReordered" },
  { receipt: "EAC9999103406", label: "readyForOath" },
  { receipt: "SRC9999132694", label: "premiumClockStopped" },
  { receipt: "EAC9999103429", label: "travelDocumentMailed" },
  { receipt: "EAC9999103413", label: "sentToStateDepartment" },
  { receipt: "EAC9999103420", label: "revocationSent" },
  { receipt: "EAC9999103412", label: "noInformation" },
] as const;
