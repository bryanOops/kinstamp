import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "@/lib/env";
import { supabaseCookieOptions } from "./cookie-options";

export function createClient() {
  const { publicUrl, anonKey } = supabaseEnv();
  return createBrowserClient<Database>(publicUrl, anonKey, { cookieOptions: supabaseCookieOptions });
}
