import { ChartNoAxesColumnIcon } from "lucide-react";
import type { Metadata } from "next";
import { io } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { toInsightSummary } from "@/components/cases/from-dto";
import { InsightsView } from "@/components/insights/insights-view";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/server/auth";
import { hasInsightsConsent, listInsights, listTrackedCases } from "@/server/cases/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("insights");
  return { title: t("title") };
}

export default async function InsightsPage() {
  // Session reads depend on the request; keep them out of any static shell.
  await io();
  const [profile, t] = await Promise.all([requireProfile("client"), getTranslations("insights")]);
  const [insights, tracked, consented] = await Promise.all([listInsights(), listTrackedCases(profile.id), hasInsightsConsent(profile.id)]);
  const ownCases = tracked.map((c) => ({
    trackedCaseId: c.trackedCaseId,
    nickname: c.nickname,
    formType: c.case.formType,
    receivedOn: c.case.submittedAt?.slice(0, 10) ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("description")} />
      {insights.length === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumnIcon}
          title={t("empty.title")}
          description={consented ? t("empty.description") : t("empty.descriptionNoConsent")}
          action={
            !consented && (
              <Link href="/settings" className={buttonVariants({ variant: "secondary" })}>
                {t("empty.consentLink")}
              </Link>
            )
          }
        />
      ) : (
        <InsightsView insights={insights.map(toInsightSummary)} ownCases={ownCases} now={new Date()} />
      )}
    </div>
  );
}
