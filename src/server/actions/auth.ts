"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { safeNextPath, signInSchema, signUpSchema } from "@/lib/auth/schemas";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { homePathFor } from "@/server/auth";

/**
 * Result of an auth form action, consumed with `useActionState`.
 * `error` and `fieldErrors` hold i18n keys under `auth.errors`.
 */
export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: { fullName?: string; email?: string; role?: string };
};

const localeCookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = signUpSchema.safeParse({
    ...values,
    password: String(formData.get("password") ?? ""),
    insightsConsent: formData.get("insightsConsent") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };

  const cookieLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const { fullName, email, password, role, insightsConsent } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      // Read by the `handle_new_user` trigger to create the profile and the consent.
      data: { full_name: fullName, role, locale, insights_consent: String(insightsConsent) },
    },
  });

  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "passwordWeak" }, values };
    if (error.code === "over_email_send_rate_limit") return { error: "tooManyEmails", values };
    return { error: "signUpFailed", values };
  }

  // With email confirmation on, Supabase answers an existing address with a user that has no
  // identities and sends nothing. Saying so reveals that the email is registered, which is the
  // usual tradeoff at sign-up; sign-in still never says which of the two fields is wrong.
  if (data.user && data.user.identities?.length === 0) return { fieldErrors: { email: "emailTaken" }, values };

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = signInSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "emailNotConfirmed", values };
    return { error: "invalidCredentials", values };
  }

  // The language chosen on the public pages is the person's latest choice: keep it and save it
  // to the profile. Without a choice, the profile's language applies.
  const { data: profile } = await supabase.from("profiles").select("role, locale").eq("id", data.user.id).single();
  const cookieStore = await cookies();
  const chosenLocale = cookieStore.get(localeCookieName)?.value;
  if (isLocale(chosenLocale)) {
    if (profile && profile.locale !== chosenLocale) await supabase.from("profiles").update({ locale: chosenLocale }).eq("id", data.user.id);
  } else if (profile && isLocale(profile.locale)) {
    cookieStore.set(localeCookieName, profile.locale, localeCookieOptions);
  }

  const next = safeNextPath(formData.get("next"));
  redirect(next ?? homePathFor(profile?.role === "attorney" ? "attorney" : "client"));
}

const signOutReasonSchema = z.enum(["idle"]).optional();

/** Signs out. With `reason: "idle"` (the idle-timeout dialog) the person lands on sign-in with a notice instead of the landing page. */
export async function signOut(reason?: unknown): Promise<void> {
  const parsed = signOutReasonSchema.safeParse(reason);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(parsed.success && parsed.data === "idle" ? "/sign-in?reason=idle" : "/");
}
