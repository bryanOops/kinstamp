import type { Metadata } from "next";
import { io } from "next/cache";
import { getTranslations } from "next-intl/server";
import { SharedCasesTable } from "@/components/attorney/shared-cases-table";
import { toSharedCaseRow } from "@/components/cases/from-dto";
import { PageHeader } from "@/components/layout/page-header";
import { TourLauncher } from "@/components/tour/tour-launcher";
import { requireProfile } from "@/server/auth";
import { listSharedCases } from "@/server/cases/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("attorney");
  return { title: t("title") };
}

export default async function AttorneyPage() {
  // Session reads depend on the request; keep them out of any static shell.
  await io();
  const [profile, t] = await Promise.all([requireProfile("attorney"), getTranslations("attorney")]);
  const rows = (await listSharedCases()).map(toSharedCaseRow);

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("description")} />
      <SharedCasesTable rows={rows} now={new Date()} attorneyEmail={profile.email} />
      <TourLauncher tour="attorney" autoStart={!profile.toursCompleted.includes("attorney")} />
    </div>
  );
}
