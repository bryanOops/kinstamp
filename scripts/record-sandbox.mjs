// Records real USCIS sandbox responses as fixtures for tests and local development.
// Run during sandbox hours (Mon–Fri, 7am–8pm Eastern): `npm run record:sandbox`.
// Uses 52 of the 1,000 daily checks: the 50 published sandbox receipts, plus one
// well-formed receipt USCIS does not know and one malformed receipt.
import { mkdirSync, writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const { USCIS_CLIENT_ID, USCIS_CLIENT_SECRET, USCIS_TOKEN_URL, USCIS_API_BASE_URL } = process.env;
if (!USCIS_CLIENT_ID || !USCIS_CLIENT_SECRET || !USCIS_TOKEN_URL || !USCIS_API_BASE_URL) {
  throw new Error("Set the USCIS_* variables in .env.local first.");
}
if (!USCIS_API_BASE_URL.includes("api-int.uscis.gov")) {
  throw new Error("Refusing to record against a non-sandbox URL.");
}

// From the Case Status API page on developer.uscis.gov (docs/uscis-api.md).
const sandboxReceipts = [
  "EAC9999103403", "EAC9999103404", "EAC9999103405", "EAC9999103410", "EAC9999103411", "EAC9999103416",
  "EAC9999103419", "LIN9999106498", "LIN9999106499", "LIN9999106504", "LIN9999106505", "LIN9999106506",
  "SRC9999102777", "SRC9999102778", "SRC9999102779", "SRC9999102780", "SRC9999102781", "SRC9999102782",
  "SRC9999102783", "SRC9999102784", "SRC9999102785", "SRC9999102786", "SRC9999102787", "SRC9999132710",
  "SRC9999132719", "EAC9999103400", "EAC9999103402", "EAC9999103406", "EAC9999103407", "EAC9999103408",
  "EAC9999103409", "EAC9999103412", "EAC9999103413", "EAC9999103414", "EAC9999103415", "EAC9999103420",
  "EAC9999103421", "EAC9999103424", "EAC9999103425", "EAC9999103426", "EAC9999103428", "EAC9999103429",
  "EAC9999103431", "EAC9999103432", "LIN9999106501", "LIN9999106507", "SRC9999132694", "SRC9999132695",
  "SRC9999132706", "SRC9999132707",
];
const probes = { "unknown-receipt": "EAC0000000001", "malformed-receipt": "EAC12345" };

const outDir = "src/lib/uscis/__fixtures__/recorded";
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tokenResponse = await fetch(USCIS_TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: USCIS_CLIENT_ID,
    client_secret: USCIS_CLIENT_SECRET,
  }),
});
const { access_token: token } = await tokenResponse.json();
if (!token) throw new Error(`Token request failed with HTTP ${tokenResponse.status}`);

async function record(receipt, fileName) {
  const response = await fetch(`${USCIS_API_BASE_URL}/${receipt}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  const recording = { recordedAt: new Date().toISOString(), receiptNumber: receipt, status: response.status, body };
  writeFileSync(`${outDir}/${fileName}.json`, `${JSON.stringify(recording, null, 2)}\n`);
  const status = typeof body === "object" ? body?.case_status?.current_case_status_text_en : undefined;
  console.log(`${receipt}  HTTP ${response.status}  ${status ?? body?.message ?? body?.error?.message ?? ""}`);
  if (response.status === 503) throw new Error("Sandbox unavailable: try again during business hours.");
  await sleep(250); // stay under 5 requests per second
}

for (const receipt of sandboxReceipts) await record(receipt, receipt);
for (const [name, receipt] of Object.entries(probes)) await record(receipt, `_${name}`);
console.log(`\nRecorded ${sandboxReceipts.length + Object.keys(probes).length} responses in ${outDir}`);
