"use client";

import { MoreHorizontalIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameTrackedCase, untrackCase, type SimpleState } from "@/server/actions/cases";

type CaseMenuProps = {
  trackedCaseId: string;
  nickname: string | null;
  receiptNumber: string;
};

/** "More" menu on the case header: rename the nickname or stop tracking (with confirmation). */
export function CaseMenu({ trackedCaseId, nickname, receiptNumber }: CaseMenuProps) {
  const t = useTranslations("caseDetail.menu");
  const [renameOpen, setRenameOpen] = useState(false);
  const [untrackOpen, setUntrackOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={t("open")} />}>
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-overlay">
          <DropdownMenuItem className="h-10 cursor-pointer rounded-lg px-2.5 text-md" onClick={() => setRenameOpen(true)}>
            <PencilLineIcon aria-hidden="true" />
            {t("rename")}
          </DropdownMenuItem>
          <DropdownMenuItem className="h-10 cursor-pointer rounded-lg px-2.5 text-md text-destructive" onClick={() => setUntrackOpen(true)}>
            <Trash2Icon aria-hidden="true" />
            {t("untrack")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog trackedCaseId={trackedCaseId} nickname={nickname} open={renameOpen} onOpenChange={setRenameOpen} />
      <UntrackDialog trackedCaseId={trackedCaseId} label={nickname ?? receiptNumber} open={untrackOpen} onOpenChange={setUntrackOpen} />
    </>
  );
}

function RenameDialog({ trackedCaseId, nickname, open, onOpenChange }: { trackedCaseId: string; nickname: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("caseDetail.menu.renameDialog");
  const errorsT = useTranslations("cases.errors");
  const id = useId();
  const [state, action] = useActionState<SimpleState, FormData>(
    async (prev, formData) => {
      const next = await renameTrackedCase(trackedCaseId, prev, formData);
      if (next.ok) onOpenChange(false);
      return next;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-sm font-medium">
              {t("label")}
            </Label>
            <Input id={id} name="nickname" defaultValue={nickname ?? ""} maxLength={80} placeholder={t("placeholder")} aria-invalid={state.error ? true : undefined} />
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {errorsT.has(state.error) ? errorsT(state.error) : errorsT("somethingWentWrong")}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>{t("cancel")}</DialogClose>
            <Submit label={t("submit")} pendingLabel={t("pending")} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UntrackDialog({ trackedCaseId, label, open, onOpenChange }: { trackedCaseId: string; label: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("caseDetail.menu.untrackDialog");
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl p-6 shadow-overlay sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-heading">{t("title", { label })}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ink-muted">{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => startTransition(() => untrackCase(trackedCaseId))}>
            {pending ? t("pending") : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
