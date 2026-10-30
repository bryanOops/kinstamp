"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteAccountDialogProps = {
  /** The person must type their email to confirm. */
  email: string;
  onConfirm?: () => void;
  pending?: boolean;
};

export function DeleteAccountDialog({ email, onConfirm, pending }: DeleteAccountDialogProps) {
  const t = useTranslations("settings.danger.dialog");
  const id = useId();
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>{t("trigger")}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl p-6 shadow-overlay sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-heading">{t("title")}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ink-muted">{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id} className="text-sm font-medium">
            {t("confirmLabel", { email })}
          </Label>
          <Input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!matches || pending} onClick={onConfirm}>
            {pending ? t("pending") : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
