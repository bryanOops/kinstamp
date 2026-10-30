"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { FormError, PasswordField, SubmitButton, TextField, useAuthError } from "@/components/auth/form-pieces";
import { signIn, type AuthFormState } from "@/server/actions/auth";

type SignInFormProps = {
  /** Same-site path to return to after signing in (from `?next=`). */
  next?: string | null;
  /** Error carried in the URL, e.g. `confirmation` when the email link failed. */
  urlError?: string | null;
};

export function SignInForm({ next, urlError }: SignInFormProps) {
  const t = useTranslations("auth");
  const translateError = useAuthError();
  const [state, action] = useActionState<AuthFormState, FormData>(signIn, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError message={translateError(state.error ?? urlError ?? undefined)} />

      <TextField
        name="email"
        type="email"
        label={t("fields.email")}
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={translateError(errors.email)}
      />
      <PasswordField
        name="password"
        label={t("fields.password")}
        autoComplete="current-password"
        required
        error={translateError(errors.password)}
      />

      <SubmitButton pendingLabel={t("signIn.pending")}>{t("signIn.submit")}</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        {t("signIn.noAccount")}{" "}
        <Link href="/sign-up" className="font-medium text-ink underline underline-offset-4 hover:text-stamp-ink">
          {t("signIn.signUpLink")}
        </Link>
      </p>
    </form>
  );
}
