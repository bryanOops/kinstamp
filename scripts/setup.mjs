// One-command local setup: Supabase (via its CLI, in Docker) + the app (Docker Compose).
// Usage: npm run setup            → start everything
//        npm run setup -- --no-app → only Supabase + env (for `npm run dev`)
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const withApp = !process.argv.includes("--no-app");
const run = (command) => execSync(command, { stdio: "inherit" });
const read = (command) => execSync(command, { encoding: "utf8" });

if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  console.log("Created .env.local from .env.example");
}

console.log("\n▶ Starting Supabase (first run downloads Docker images, a few minutes)…");
run("npx supabase start");
run("npx supabase migration up");

// Fill the local Supabase URL and keys into .env.local.
const status = Object.fromEntries(
  read("npx supabase status -o env")
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);

const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
};

let env = readFileSync(".env.local", "utf8");
for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`;
  env = new RegExp(`^${key}=.*$`, "m").test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : `${env.trimEnd()}\n${line}\n`;
}
writeFileSync(".env.local", env);
console.log("Wrote local Supabase URL and keys to .env.local");

if (withApp) {
  console.log("\n▶ Building and starting the app container…");
  run("docker compose --env-file .env.local up --build -d");
  console.log("\n✔ Kinstamp:          http://localhost:3000");
} else {
  console.log("\n✔ Supabase is ready. Run `npm run dev` to start the app.");
}
console.log("  Supabase Studio:   http://127.0.0.1:54323");
console.log("  Test inbox (email): http://127.0.0.1:54324");
