"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AddKeyDateButton } from "@/components/cases/key-dates-card";
import type { KeyDate } from "@/components/cases/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addKeyDate, deleteKeyDate, type KeyDateState } from "@/server/actions/cases";
import { cn } from "@/lib/utils";

/** "Add a key date" button + form dialog wired to `addKeyDate`. Closes itself on success. */
export function AddKeyDateControl({ trackedCaseId }: { trackedCaseId: string }) {
  const t = useTranslations("caseDetail.keyDates.form");
  const errorsT = useTranslations("caseDetail.keyDates.errors");
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<KeyDateState, FormData>(
    async (prev, formData) => {
      const next = await addKeyDate(trackedCaseId, prev, formData);
      if (next.ok) setOpen(false);
      return next;
    },
    {},
  );
  const ids = { kind: useId(), date: useId(), time: useId(), title: useId(), notes: useId() };
  const errors = state.fieldErrors ?? {};
  const fieldError = (key: string | undefined) => (key ? (errorsT.has(key) ? errorsT(key) : errorsT("somethingWentWrong")) : undefined);

  return (
    <>
      <AddKeyDateButton onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <form action={action} className="flex flex-col gap-4" noValidate>
            {state.error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-status-denied-tint px-3.5 py-2.5 text-sm text-destructive">
                {fieldError(state.error)}
              </p>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-medium text-ink">{t("kind")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["due_date", "appointment"] as const).map((kind) => (
                  <label
                    key={kind}
                    className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink transition-colors has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2"
                  >
                    <input type="radio" name="kind" value={kind} defaultChecked={kind === "due_date"} className="sr-only" />
                    {t(`kinds.${kind}`)}
                  </label>
                ))}
              </div>
              {errors.kind && <FieldError id={ids.kind}>{fieldError(errors.kind)}</FieldError>}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={ids.date} label={t("date")} error={fieldError(errors.date)}>
                <Input id={ids.date} name="date" type="date" required aria-invalid={errors.date ? true : undefined} />
              </Field>
              <Field id={ids.time} label={t("time")} hint={t("timeHint")} error={fieldError(errors.time)}>
                <Input id={ids.time} name="time" type="time" aria-invalid={errors.time ? true : undefined} />
              </Field>
            </div>

            <Field id={ids.title} label={t("titleField")} error={fieldError(errors.title)}>
              <Input id={ids.title} name="title" placeholder={t("titlePlaceholder")} maxLength={120} required aria-invalid={errors.title ? true : undefined} />
            </Field>
            <Field id={ids.notes} label={t("notes")} error={fieldError(errors.notes)}>
              <Textarea id={ids.notes} name="notes" rows={3} maxLength={1000} placeholder={t("notesPlaceholder")} />
            </Field>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>{t("cancel")}</DialogClose>
              <Submit label={t("submit")} pendingLabel={t("pending")} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Delete button for one key date, wired to `deleteKeyDate`. */
export function DeleteKeyDateButton({ keyDate }: { keyDate: KeyDate }) {
  const t = useTranslations("caseDetail.keyDates");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-ink-muted hover:text-destructive"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => deleteKeyDate(keyDate.id))}
      aria-label={t("delete", { title: keyDate.title })}
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? <FieldError id={id}>{error}</FieldError> : hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function FieldError({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <p id={`${id}-error`} role="alert" className={cn("text-sm text-destructive", className)}>
      {children}
    </p>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
