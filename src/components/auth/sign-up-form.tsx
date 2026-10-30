"use client";

import { CheckIcon, ScaleIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { FormError, PasswordField, SubmitButton, TextField, useAuthError } from "@/components/auth/form-pieces";
import { Checkbox } from "@/components/ui/checkbox";
import { signUp, type AuthFormState } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

const roles = [
  { value: "client", icon: UsersRoundIcon },
  { value: "attorney", icon: ScaleIcon },
] as const;

export function SignUpForm() {
  const t = useTranslations("auth");
  const translateError = useAuthError();
  const [state, action] = useActionState<AuthFormState, FormData>(signUp, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={translateError(state.error)} />

      <TextField
        name="fullName"
        label={t("fields.fullName")}
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        error={translateError(errors.fullName)}
      />
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
        autoComplete="new-password"
        required
        minLength={8}
        hint={t("fields.passwordHint")}
        error={translateError(errors.password)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">{t("fields.role")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map(({ value, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-(--duration-fast)",
                "hover:border-ink-disabled has-checked:border-ink has-checked:shadow-[inset_0_0_0_1px_var(--color-ink)] has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
              )}
            >
              <input
                type="radio"
                name="role"
                value={value}
                defaultChecked={state.values?.role === value}
                className="peer sr-only"
                required
              />
              <span className="flex items-center justify-between">
                <Icon className="size-5 text-ink" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="inline-flex size-5 items-center justify-center rounded-full border border-line-strong bg-surface text-white transition-colors group-has-checked:border-ink group-has-checked:bg-ink"
                >
                  <CheckIcon className="size-3 opacity-0 transition-opacity group-has-checked:opacity-100" />
                </span>
              </span>
              <span className="text-sm font-medium text-ink">{t(`roles.${value}.label`)}</span>
              <span className="text-xs text-ink-muted">{t(`roles.${value}.hint`)}</span>
            </label>
          ))}
        </div>
        {errors.role && (
          <p role="alert" className="text-sm text-destructive">
            {translateError(errors.role)}
          </p>
        )}
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-canvas/60 p-4 text-sm text-ink has-focus-visible:ring-2 has-focus-visible:ring-ring">
        <Checkbox name="insightsConsent" value="on" className="mt-0.5" />
        <span>{t("consent")}</span>
      </label>

      <SubmitButton pendingLabel={t("signUp.pending")}>{t("signUp.submit")}</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        {t("signUp.haveAccount")}{" "}
        <Link href="/sign-in" className="font-medium text-ink underline underline-offset-4 hover:text-stamp-ink">
          {t("signUp.signInLink")}
        </Link>
      </p>
    </form>
  );
}
