// Checks every published sandbox receipt once and stores it as a regular case, so a
// reviewer who adds one while the sandbox is closed still sees real data (docs/spec.md,
// "Pre-checked sandbox cases"). Only for the sandbox: with real receipt numbers Kinstamp
// never checks a case nobody asked for.
//
//   npm run precheck:sandbox                 → local Supabase (.env.local)
//   npm run precheck:sandbox -- --production → production Supabase (.env.production.local)
import { loadEnv } from "./load-env";

loadEnv(process.argv.includes("--production"));

const { USCIS_API_BASE_URL } = process.env;
if (USCIS_API_BASE_URL && !USCIS_API_BASE_URL.includes("api-int.uscis.gov")) {
  throw new Error("Refusing to pre-check against a non-sandbox USCIS URL.");
}

const { sandboxReceiptNumbers } = await import("../src/lib/uscis/sandbox-receipts");
const { createAdminClient } = await import("../src/lib/supabase/admin");
const { runCheck } = await import("../src/server/cases/run-check");

const admin = createAdminClient();
let ok = 0;
for (const receiptNumber of sandboxReceiptNumbers) {
  const { data: existing } = await admin.from("cases").select("id").eq("receipt_number", receiptNumber).maybeSingle();
  const caseId =
    existing?.id ??
    (await admin.from("cases").insert({ receipt_number: receiptNumber }).select("id").single()).data?.id;
  if (!caseId) throw new Error(`Could not create case ${receiptNumber}`);

  const result = await runCheck({ caseId, receiptNumber, trigger: "scheduled", requestedBy: null });
  console.log(`${receiptNumber}  ${result.ok ? (result.changed ? "changed" : "ok") : result.errorCode}`);
  if (result.ok) ok += 1;
  if (!result.ok && (result.outsideHours || result.errorCode === "quota_exhausted")) break;
  await new Promise((resolve) => setTimeout(resolve, 250));
}
console.log(`\nPre-checked ${ok} of ${sandboxReceiptNumbers.length} sandbox receipts.`);
