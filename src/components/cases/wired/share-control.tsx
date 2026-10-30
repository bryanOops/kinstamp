"use client";

import { useTranslations } from "next-intl";
import { useActionState, useTransition } from "react";
import { ShareDialog } from "@/components/cases/share-dialog";
import type { Share } from "@/components/cases/types";
import { Button } from "@/components/ui/button";
import { revokeShare, shareCase, type SimpleState } from "@/server/actions/cases";

/** Share dialog wired to `shareCase`, with revoke buttons wired to `revokeShare`. */
export function ShareControl({ trackedCaseId, shares }: { trackedCaseId: string; shares: Share[] }) {
  const [state, action] = useActionState<SimpleState, FormData>(shareCase.bind(null, trackedCaseId), {});
  return <ShareDialog shares={shares} action={action} state={state} rowActions={(share) => <RevokeShareButton share={share} />} />;
}

export function RevokeShareButton({ share }: { share: Share }) {
  const t = useTranslations("caseDetail.shares");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      size="xs"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => revokeShare(share.id))}
      aria-label={t("revokeFor", { email: share.attorneyEmail })}
    >
      {pending ? t("revoking") : t("revoke")}
    </Button>
  );
}
