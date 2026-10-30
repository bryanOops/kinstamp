"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/status/empty-state";
import { Button } from "@/components/ui/button";

type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** Error boundary content for app routes. Never shows the stack trace. */
export function RouteError({ error, retry }: RouteErrorProps) {
  const t = useTranslations("errors");
  return (
    <EmptyState
      title={t("title")}
      description={
        <>
          {t("description")}
          {error.digest && <span className="mt-2 block font-mono text-xs text-ink-subtle">{t("reference", { id: error.digest })}</span>}
        </>
      }
      action={
        <Button variant="secondary" onClick={retry}>
          <RotateCcwIcon aria-hidden="true" />
          {t("retry")}
        </Button>
      }
    />
  );
}
