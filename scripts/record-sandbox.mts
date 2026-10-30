// Records real USCIS sandbox responses as fixtures for tests and local development.
// Run during sandbox hours (Mon–Fri, 7am–8pm Eastern): `npm run record:sandbox`.
// Uses 52 of the 1,000 daily checks: the 50 published sandbox receipts, plus one
// well-formed receipt USCIS does not know and one malformed receipt.
import { mkdirSync, writeFileSync } from "node:fs";
import { sandboxReceiptNumbers as sandboxReceipts } from "../src/lib/uscis/sandbox-receipts";
import { loadEnv } from "./load-env";

loadEnv(false);
const { USCIS_CLIENT_ID, USCIS_CLIENT_SECRET, USCIS_TOKEN_URL, USCIS_API_BASE_URL } = process.env;
if (!USCIS_CLIENT_ID || !USCIS_CLIENT_SECRET || !USCIS_TOKEN_URL || !USCIS_API_BASE_URL) {
  throw new Error("Set the USCIS_* variables in .env.local first.");
}
if (!USCIS_API_BASE_URL.includes("api-int.uscis.gov")) {
  throw new Error("Refusing to record against a non-sandbox URL.");
}

const probes = { "unknown-receipt": "EAC0000000001", "malformed-receipt": "EAC12345" };

const outDir = "src/lib/uscis/__fixtures__/recorded";
mkdirSync(outDir, { recursive: true });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tokenResponse = await fetch(USCIS_TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: USCIS_CLIENT_ID,
    client_secret: USCIS_CLIENT_SECRET,
  }),
});
const { access_token: token } = (await tokenResponse.json()) as { access_token?: string };
if (!token) throw new Error(`Token request failed with HTTP ${tokenResponse.status}`);

async function record(receipt: string, fileName: string) {
  const response = await fetch(`${USCIS_API_BASE_URL}/${receipt}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  const recording = { recordedAt: new Date().toISOString(), receiptNumber: receipt, status: response.status, body };
  writeFileSync(`${outDir}/${fileName}.json`, `${JSON.stringify(recording, null, 2)}\n`);
  console.log(`${receipt}  HTTP ${response.status}  ${text.slice(0, 120).replace(/\s+/g, " ")}`);
  if (response.status === 503) throw new Error("Sandbox unavailable: try again during business hours.");
  await sleep(250); // stay under 5 requests per second
}

for (const receipt of sandboxReceipts) await record(receipt, receipt);
for (const [name, receipt] of Object.entries(probes)) await record(receipt, `_${name}`);
console.log(`\nRecorded ${sandboxReceipts.length + Object.keys(probes).length} responses in ${outDir}`);
