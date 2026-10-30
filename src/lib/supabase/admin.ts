import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { serviceRoleKey, supabaseEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS: only for checks, scheduled checks and seeding.
 * Never import it from code that runs in the browser.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseEnv().serverUrl, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
