import { loadEnvConfig } from "@next/env";
import { existsSync, readFileSync } from "node:fs";

/**
 * Loads `.env.local` like Next.js does. With `production`, values from
 * `.env.production.local` (production Supabase) override the Supabase ones.
 */
export function loadEnv(production: boolean): void {
  // Development mode: reads .env.local and never .env.production.local.
  loadEnvConfig(process.cwd(), true);
  if (!production) return;
  if (!existsSync(".env.production.local")) throw new Error("Missing .env.production.local");
  for (const line of readFileSync(".env.production.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}
