import { z } from "zod";

// Environment variables validated at the boundary (CLAUDE.md). Read lazily, so a
// missing optional integration (Resend, Anthropic) never breaks the rest of the app.

const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_INTERNAL_URL: z.url().optional(),
});

/** Supabase URL and anon key; the URL the server uses can differ inside Docker. */
export function supabaseEnv() {
  const env = supabaseSchema.parse({
    // Direct references so Next.js inlines the public values into the browser bundle.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_INTERNAL_URL: process.env.SUPABASE_INTERNAL_URL || undefined,
  });
  return {
    publicUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    serverUrl: env.SUPABASE_INTERNAL_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** The service-role key. Server only: it bypasses RLS. */
export function serviceRoleKey(): string {
  return z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is missing").parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Public base URL of the app, without a trailing slash (auth redirects, email links). */
export function siteUrl(): string {
  return z.url("NEXT_PUBLIC_SITE_URL is missing or invalid").parse(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
}

const uscisSchema = z.object({
  USCIS_CLIENT_ID: z.string().min(1),
  USCIS_CLIENT_SECRET: z.string().min(1),
  USCIS_TOKEN_URL: z.url(),
  USCIS_API_BASE_URL: z.url(),
});

/** USCIS credentials, or null when they are not configured (local development). */
export function uscisEnv(): z.infer<typeof uscisSchema> | null {
  const parsed = uscisSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}

/** The secret Vercel Cron sends; null disables the cron endpoint. */
export function cronSecret(): string | null {
  const value = process.env.CRON_SECRET;
  return value && value.length >= 16 ? value : null;
}
