"use client";

import { Share2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { StatusDot } from "@/components/status/status-indicator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Share } from "./types";

export type ShareFormState = {
  /** i18n key under `caseDetail.share.errors` */
  error?: string;
  values?: { attorneyEmail?: string };
};

type ShareDialogProps = {
  shares: Share[];
  action?: (formData: FormData) => void | Promise<void>;
  state?: ShareFormState;
  onRevoke?: (share: Share) => void;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ShareDialog({ shares, action, state, onRevoke, trigger, open, onOpenChange }: ShareDialogProps) {
  const t = useTranslations("caseDetail.share");
  const errorsT = useTranslations("caseDetail.share.errors");
  const format = useFormatter();
  const emailId = useId();
  const ordered = [...shares].sort((a, b) => rank(a) - rank(b));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        nativeButton={!trigger}
        render={
          trigger ? (
            <span />
          ) : (
            <Button variant="secondary">
              <Share2Icon aria-hidden="true" />
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

        <form action={action} className="flex flex-col gap-4" noValidate>
          {state?.error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-status-denied-tint px-3.5 py-2.5 text-sm text-destructive">
              {errorsT.has(state.error) ? errorsT(state.error) : errorsT("unknown")}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={emailId} className="text-sm font-medium">
              {t("email.label")}
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={emailId}
                name="attorneyEmail"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder={t("email.placeholder")}
                defaultValue={state?.values?.attorneyEmail}
                required
                aria-invalid={state?.error ? true : undefined}
              />
              <ShareSubmit label={t("submit")} pendingLabel={t("pending")} />
            </div>
            <p className="text-sm text-ink-muted">{t("email.hint")}</p>
          </div>
        </form>

        <div className="border-t border-line pt-4">
          <p className="text-caps text-ink-muted">{t("listTitle")}</p>
          {ordered.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">{t("listEmpty")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {ordered.map((share) => (
                <li key={share.id} className={cn("flex items-center justify-between gap-3 py-3", share.status === "revoked" && "opacity-70")}>
                  <div className="min-w-0">
                    <p className={cn("truncate text-md text-ink", share.status === "revoked" ? "line-through decoration-ink-disabled" : "font-medium")}>
                      {share.attorneyEmail}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                      <StatusDot tone={share.status === "active" ? "approved" : share.status === "pending" ? "action" : "unknown"} />
                      {share.status === "active" && t("status.active", { date: format.dateTime(new Date(share.createdAt), { month: "short", day: "numeric" }) })}
                      {share.status === "pending" && t("status.pending")}
                      {share.status === "revoked" && share.revokedAt && t("status.revoked", { date: format.dateTime(new Date(share.revokedAt), { month: "short", day: "numeric" }) })}
                    </p>
                  </div>
                  {share.status !== "revoked" && onRevoke && (
                    <Button variant="destructive" size="xs" onClick={() => onRevoke(share)}>
                      {t("revoke")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>{t("close")}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function rank(share: Share): number {
  return share.status === "active" ? 0 : share.status === "pending" ? 1 : 2;
}

function ShareSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className="shrink-0">
      {pending ? pendingLabel : label}
    </Button>
  );
}
