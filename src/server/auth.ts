import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "client" | "attorney";

export type CurrentProfile = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  locale: "en" | "es";
};

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
    .select("id, full_name, email, role, locale")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role === "attorney" ? "attorney" : "client",
    locale: profile.locale === "es" ? "es" : "en",
  };
});

/** The signed-in person; redirects to sign-in, or to their own home when the role does not match. */
export async function requireProfile(role?: Role): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (role && profile.role !== role) redirect(homePathFor(profile.role));
  return profile;
}

export function homePathFor(role: Role): string {
  return role === "attorney" ? "/attorney" : "/cases";
}
