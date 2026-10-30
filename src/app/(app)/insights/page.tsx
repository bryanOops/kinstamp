import { ChartNoAxesColumnIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/empty-state";
import { requireProfile } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("insights");
  return { title: t("title") };
}

export default async function InsightsPage() {
  const [, t] = await Promise.all([requireProfile("client"), getTranslations("insights")]);

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("description")} />
      {/* Data layer pending: `insights_by_form_type` results are rendered with InsightsView. */}
      <EmptyState icon={ChartNoAxesColumnIcon} title={t("empty.title")} description={t("empty.description")} />
    </div>
  );
}
