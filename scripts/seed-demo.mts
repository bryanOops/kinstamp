// (Re)creates the two demo accounts listed in the README, with tracked cases, a share,
// key dates and consent. Safe to re-run: it deletes the demo accounts first.
//
//   npm run seed:demo                 → local Supabase (.env.local)
//   npm run seed:demo -- --production → production Supabase (.env.production.local)
import { loadEnv } from "./load-env";

loadEnv(process.argv.includes("--production"));

const { createAdminClient } = await import("../src/lib/supabase/admin");
const { runCheck } = await import("../src/server/cases/run-check");

// Demo credentials are public on purpose (README): the accounts only hold sandbox data.
export const demoAccounts = {
  client: { email: "demo-client@kinstamp.com", password: "kinstamp-demo-2026", fullName: "Maria Lopez" },
  attorney: { email: "demo-attorney@kinstamp.com", password: "kinstamp-demo-2026", fullName: "Ana Torres, Esq." },
} as const;

const trackedCases = [
  { receiptNumber: "EAC9999103403", nickname: "Mom's petition", shareWithAttorney: true },
  { receiptNumber: "EAC9999103424", nickname: "Carlos's petition", shareWithAttorney: true },
  { receiptNumber: "LIN9999106501", nickname: "Sofia's petition", shareWithAttorney: false },
  { receiptNumber: "EAC9999103408", nickname: "Dad's petition", shareWithAttorney: false },
  // Four more approved I-130s: with Mom's petition, the five a form needs before insights show.
  { receiptNumber: "EAC9999103404", nickname: "Grandma's petition", shareWithAttorney: false },
  { receiptNumber: "EAC9999103405", nickname: "Luis's petition", shareWithAttorney: false },
  { receiptNumber: "EAC9999103410", nickname: "Elena's petition", shareWithAttorney: false },
  { receiptNumber: "EAC9999103411", nickname: "Tomas's petition", shareWithAttorney: false },
];

const admin = createAdminClient();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

// 1. Remove previous demo accounts (cascades to their tracked cases, shares and key dates).
const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
for (const user of users?.users ?? []) {
  if (Object.values(demoAccounts).some((account) => account.email === user.email)) {
    await admin.auth.admin.deleteUser(user.id);
  }
}
await admin.from("shares").delete().eq("attorney_email", demoAccounts.attorney.email);

// 2. Create both accounts, already confirmed.
async function createAccount(role: "client" | "attorney") {
  const account = demoAccounts[role];
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: account.fullName, role, locale: "en", insights_consent: String(role === "client") },
  });
  if (error || !data.user) throw error ?? new Error(`Could not create ${role}`);
  return data.user.id;
}
const clientId = await createAccount("client");
const attorneyId = await createAccount("attorney");

// 3. Tracked cases (checking USCIS only for cases not already stored), shares and key dates.
for (const [index, item] of trackedCases.entries()) {
  let { data: caseRow } = await admin
    .from("cases")
    .select("id, check_state")
    .eq("receipt_number", item.receiptNumber)
    .maybeSingle();
  if (!caseRow) {
    caseRow = (await admin.from("cases").insert({ receipt_number: item.receiptNumber }).select("id, check_state").single()).data;
  }
  if (!caseRow) throw new Error(`Could not create case ${item.receiptNumber}`);
  if (caseRow.check_state !== "ok") {
    const result = await runCheck({ caseId: caseRow.id, receiptNumber: item.receiptNumber, trigger: "scheduled", requestedBy: null });
    if (!result.ok) console.warn(`  ${item.receiptNumber}: USCIS check failed (${result.errorCode}); the case shows as awaiting.`);
  }

  const { data: tracked, error } = await admin
    .from("tracked_cases")
    .insert({ case_id: caseRow.id, client_id: clientId, nickname: item.nickname, last_viewed_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !tracked) throw error;

  if (item.shareWithAttorney) {
    // The first case is shared just before Kinstamp recorded its newest status event, so the
    // attorney's "Needs review" filter has an example. The status data itself is untouched.
    let sharedAt: string | undefined;
    if (index === 0) {
      const { data: lastEvent } = await admin
        .from("status_events")
        .select("created_at")
        .eq("case_id", caseRow.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastEvent) sharedAt = new Date(Date.parse(lastEvent.created_at) - 3_600_000).toISOString();
    }
    await admin.from("shares").insert({ tracked_case_id: tracked.id, attorney_email: demoAccounts.attorney.email, created_at: sharedAt });
  }
  if (index === 0) {
    await admin.from("key_dates").insert({
      tracked_case_id: tracked.id,
      kind: "appointment",
      date: daysFromNow(9),
      time: "09:30",
      title: "Biometrics appointment",
      notes: "Bring the appointment notice and a photo ID.",
      created_by: clientId,
    });
  }
  if (index === 1) {
    await admin.from("key_dates").insert({
      tracked_case_id: tracked.id,
      kind: "due_date",
      date: daysFromNow(24),
      title: "Respond to the request for evidence",
      created_by: attorneyId,
    });
  }
  console.log(`  ${item.receiptNumber}  "${item.nickname}"${item.shareWithAttorney ? "  shared" : ""}`);
}

console.log(`\nDemo client:   ${demoAccounts.client.email}\nDemo attorney: ${demoAccounts.attorney.email}\nPassword:      ${demoAccounts.client.password}`);
