import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseServerUrl } from "./urls";

/**
 * Service-role client. Bypasses RLS: only for checks, scheduled checks and seeding.
 * Never import it from code that runs in the browser.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseServerUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
