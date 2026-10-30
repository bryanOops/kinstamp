import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { StatusDot } from "@/components/status/status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Share } from "./types";

type SharedWithCardProps = {
  shares: Share[];
  /** Trigger of the share dialog, provided by the data layer. */
  shareAction?: ReactNode;
  onRevoke?: (share: Share) => void;
};

/** Attorneys this case is shared with. Revoked shares are hidden here (the dialog shows them). */
export function SharedWithCard({ shares, shareAction, onRevoke }: SharedWithCardProps) {
  const t = useTranslations("caseDetail.shares");
  const format = useFormatter();
  const visible = shares.filter((s) => s.status !== "revoked");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        {shareAction && <CardAction>{shareAction}</CardAction>}
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-md text-ink-muted">{t("empty")}</p>
        ) : (
          <ul className="-my-1 divide-y divide-line">
            {visible.map((share) => (
              <li key={share.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                <div className="min-w-0">
                  <p className="truncate text-md font-medium text-ink">{share.attorneyEmail}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                    <StatusDot tone={share.status === "active" ? "approved" : "action"} />
                    {share.status === "active"
                      ? t("activeSince", { date: format.dateTime(new Date(share.createdAt), { month: "short", day: "numeric" }) })
                      : t("pending")}
                  </p>
                </div>
                {onRevoke && (
                  <Button variant="destructive" size="xs" onClick={() => onRevoke(share)}>
                    {t("revoke")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
