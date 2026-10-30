import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseCookieOptions } from "./cookie-options";
import { supabaseEnv } from "@/lib/env";

/** Supabase client acting as the signed-in person: every query goes through RLS. */
export async function createClient() {
  const cookieStore = await cookies();

  const { serverUrl, anonKey } = supabaseEnv();
  return createServerClient<Database>(
    serverUrl,
    anonKey,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The proxy refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}
