import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isTourId, type TourId } from "@/components/tour/tours";
import { safeNextPath } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export type Role = "client" | "attorney";

export type CurrentProfile = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  locale: "en" | "es";
  /** Guided tours already finished or skipped (see `src/components/tour/`). */
  toursCompleted: TourId[];
};

/** Set by the proxy so server code can send people back where they were after signing in again. */
export const PATHNAME_HEADER = "x-kinstamp-pathname";

/**
 * Data Access Layer entry point: the verified signed-in person, or null.
 * `getClaims` validates the JWT, so this is safe to use for authorization.
 * Memoized per request, so the top bar and the page share one lookup.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, locale, tours_completed")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role === "attorney" ? "attorney" : "client",
    locale: profile.locale === "es" ? "es" : "en",
    toursCompleted: profile.tours_completed.filter(isTourId),
  };
});

/**
 * The signed-in person; redirects to sign-in, or to their own home when the role does not match.
 * The proxy normally catches a missing session first (with `reason=expired` and `next`); this is
 * the fallback for sessions that vanish between the proxy and the page, or profiles that no longer exist.
 */
export async function requireProfile(role?: Role): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(await expiredSignInPath());
  if (role && profile.role !== role) redirect(homePathFor(profile.role));
  return profile;
}

async function expiredSignInPath(): Promise<string> {
  const params = new URLSearchParams({ reason: "expired" });
  const next = safeNextPath((await headers()).get(PATHNAME_HEADER));
  if (next) params.set("next", next);
  return `/sign-in?${params}`;
}

export function homePathFor(role: Role): string {
  return role === "attorney" ? "/attorney" : "/cases";
}
