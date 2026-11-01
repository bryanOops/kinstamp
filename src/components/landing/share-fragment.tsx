import { UserRoundPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SharedWithCard } from "@/components/cases/shared-with-card";
import type { Share } from "@/components/cases/types";
import { buttonVariants } from "@/components/ui/button";

const shares: Share[] = [
  { id: "sh_1", attorneyEmail: "ana@lawfirm.com", status: "active", createdAt: "2026-10-12T10:00:00Z", revokedAt: null },
  { id: "sh_2", attorneyEmail: "luis@abogados.pe", status: "pending", createdAt: "2026-10-28T09:15:00Z", revokedAt: null },
];

/** The app's own "Shared with" card: one active share, one pending, and Revoke on every row. */
export function ShareFragment() {
  const t = useTranslations("caseDetail");

  return (
    <div className="mx-auto max-w-[34rem] lg:mx-0">
      <SharedWithCard
        shares={shares}
        shareAction={
          <span className={buttonVariants({ variant: "outline", size: "sm" })}>
            <UserRoundPlusIcon />
            {t("share.trigger")}
          </span>
        }
        rowActions={() => <span className={buttonVariants({ variant: "outline", size: "xs" })}>{t("shares.revoke")}</span>}
      />
    </div>
  );
}
