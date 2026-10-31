import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** "My notes" on the attorney case detail. The privacy line is always visible, not hidden in a tooltip. */
export function NotesCard({ children }: { children: ReactNode }) {
  const t = useTranslations("attorney.notes");
  return (
    <Card data-tour="attorney-notes">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription className="flex items-start gap-1.5">
          <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t("privacy")}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
