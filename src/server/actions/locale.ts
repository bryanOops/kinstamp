"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookieName, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const localeCookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

/**
 * Switches the interface language. The cookie drives rendering for everyone;
 * signed-in people also get their profile updated so the choice follows them.
 * Setting the cookie re-renders the current route in the same response.
 */
export async function setLocale(value: unknown): Promise<{ locale: Locale } | { error: "invalidLocale" }> {
  if (!isLocale(value)) return { error: "invalidLocale" };

  (await cookies()).set(localeCookieName, value, localeCookieOptions);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (userId) {
    // RLS only lets a person update their own row; a failure here must not block the switch.
    await supabase.from("profiles").update({ locale: value }).eq("id", userId);
  }

  return { locale: value };
}
