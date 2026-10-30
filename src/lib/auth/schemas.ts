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

/** Only same-site relative paths are allowed as a post-sign-in destination. */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}
