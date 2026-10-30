import { z } from "zod";

// Error messages are i18n keys under `auth.errors`; the UI translates them.
const email = z.string().trim().toLowerCase().pipe(z.email("invalidEmail"));

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "nameRequired").max(120, "nameTooLong"),
  email,
  password: z.string().min(8, "passwordTooShort").max(72, "passwordTooLong"),
  role: z.enum(["client", "attorney"], "roleRequired"),
  insightsConsent: z.boolean(),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export const signInReasons = ["idle", "expired"] as const;
export type SignInReason = (typeof signInReasons)[number];

/** Why the person is back at sign-in (`?reason=`); anything else shows no notice. */
export function signInReason(value: unknown): SignInReason | null {
  const parsed = z.enum(signInReasons).safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Only same-site relative paths are allowed as a post-sign-in destination. */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  // Control characters (tab, newline) are dropped by URL parsers, so "/\t/evil.com" would
  // resolve to "//evil.com". Encoded forms are rejected too. Then let the parser decide.
  if (/[\u0000-\u001f\u007f]/.test(value) || /%(0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return null;
  const origin = "https://kinstamp.invalid";
  return new URL(value, origin).origin === origin ? value : null;
}
