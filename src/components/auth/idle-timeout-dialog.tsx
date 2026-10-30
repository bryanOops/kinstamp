"use client";

import { useTranslations } from "next-intl";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { WARNING_MS } from "@/lib/auth/idle";
import { signOut } from "@/server/actions/auth";

/**
 * "Still there?" after 30 minutes without activity, with a one-minute countdown. Staying
 * resets the clock; the countdown running out (or "Sign out now") signs the person out and
 * sends them to sign-in with an explanation. Mounted once in the signed-in layout.
 */
export function IdleTimeoutDialog() {
  const t = useTranslations("idle");
  const [pending, startTransition] = useTransition();
  const signOutIdle = useCallback(() => startTransition(() => signOut("idle")), [startTransition]);
  const { status, stay } = useIdleTimeout({ onExpire: signOutIdle });

  const open = status.kind !== "active";
  const seconds = status.kind === "warning" ? status.secondsLeft : 0;
  const leaving = pending || status.kind === "expired";

  return (
    // Esc counts as "I'm here": the dialog closes and the clock restarts.
    <AlertDialog open={open} onOpenChange={(next) => !next && !leaving && stay()}>
      <AlertDialogContent className="gap-5 p-6 shadow-overlay ring-0">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-heading">{t("title")}</AlertDialogTitle>
          <AlertDialogDescription className="text-md text-ink-muted">{leaving ? t("signingOut") : t("description", { seconds })}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* Time left as a shrinking line. The number in the description carries the meaning; under reduced motion the line steps once per second instead of gliding. */}
        <div aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-canvas-deep">
          <div className="h-full rounded-full bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${(seconds / (WARNING_MS / 1000)) * 100}%` }} />
        </div>
        <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-xl bg-canvas px-6 py-4">
          <Button variant="outline" onClick={signOutIdle} disabled={leaving} aria-busy={pending}>
            {t("signOut")}
          </Button>
          <Button onClick={stay} disabled={leaving} autoFocus>
            {t("stay")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
