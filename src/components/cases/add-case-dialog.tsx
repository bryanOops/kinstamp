"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isReceiptNumber, normalizeReceiptNumber } from "@/lib/format/receipt";
import { cn } from "@/lib/utils";

const sandboxReceipts = ["EAC9999103403", "LIN9999106498", "SRC9999102777", "EAC9999103402"] as const;

export type AddCaseFormState = {
  /** i18n key under `cases.add.errors` */
  error?: string;
  fieldErrors?: Partial<Record<"receiptNumber" | "nickname", string>>;
  values?: { receiptNumber?: string; nickname?: string };
};

type AddCaseDialogProps = {
  /**
   * Form action from the data layer (`useActionState`-shaped). When omitted the dialog
   * still validates inline, which is what the gallery shows.
   */
  action?: (formData: FormData) => void | Promise<void>;
  state?: AddCaseFormState;
  trigger?: ReactNode;
  /** Controlled open state, used by the gallery to show the dialog inline. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddCaseDialog({ action, state, trigger, open, onOpenChange }: AddCaseDialogProps) {
  const t = useTranslations("cases.add");
  const errorsT = useTranslations("cases.add.errors");
  const receiptId = useId();
  const nicknameId = useId();
  const [receipt, setReceipt] = useState(state?.values?.receiptNumber ?? "");
  const [touched, setTouched] = useState(false);

  const normalized = normalizeReceiptNumber(receipt);
  const localError = touched && normalized.length > 0 && !isReceiptNumber(normalized) ? "invalidFormat" : null;
  const serverError = state?.fieldErrors?.receiptNumber;
  const receiptError = localError ?? serverError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          trigger ? (
            <span />
          ) : (
            <Button>
              <PlusIcon aria-hidden="true" />
              {t("trigger")}
            </Button>
          )
        }
      >
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-5" noValidate>
          {state?.error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-status-denied-tint px-3.5 py-2.5 text-sm text-destructive">
              {errorsT.has(state.error) ? errorsT(state.error) : errorsT("unknown")}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={receiptId} className="text-sm font-medium">
              {t("receipt.label")}
            </Label>
            <Input
              id={receiptId}
              name="receiptNumber"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={t("receipt.placeholder")}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              maxLength={16}
              required
              aria-invalid={receiptError ? true : undefined}
              aria-describedby={`${receiptId}-hint`}
              className="font-mono tracking-[0.06em] uppercase"
            />
            <p id={`${receiptId}-hint`} role={receiptError ? "alert" : undefined} className={cn("text-sm", receiptError ? "text-destructive" : "text-ink-muted")}>
              {receiptError ? (errorsT.has(receiptError) ? errorsT(receiptError) : errorsT("unknown")) : t("receipt.hint")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nicknameId} className="text-sm font-medium">
              {t("nickname.label")}
            </Label>
            <Input id={nicknameId} name="nickname" defaultValue={state?.values?.nickname} placeholder={t("nickname.placeholder")} maxLength={80} />
            <p className="text-sm text-ink-muted">{t("nickname.hint")}</p>
          </div>

          <details className="group rounded-xl border border-line bg-canvas/60 open:bg-canvas">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <PlusIcon className="size-3.5 transition-transform duration-(--duration-fast) group-open:rotate-45" aria-hidden="true" />
                {t("sandbox.title")}
              </span>
            </summary>
            <div className="border-t border-line px-4 py-3">
              <p className="text-sm text-ink-muted">{t("sandbox.description")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {sandboxReceipts.map((sample) => (
                  <li key={sample}>
                    <button
                      type="button"
                      onClick={() => {
                        setReceipt(sample);
                        setTouched(true);
                      }}
                      className="rounded-md border border-line bg-surface px-2.5 py-1.5 transition-colors duration-(--duration-fast) hover:border-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      aria-label={t("sandbox.use", { receipt: sample })}
                    >
                      <ReceiptNumber value={sample} size="sm" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>{t("cancel")}</DialogClose>
            <FindButton label={t("submit")} pendingLabel={t("pending")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FindButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
