import type { Metadata } from "next";
import { io } from "next/cache";
import { getTranslations } from "next-intl/server";
import { CaseList } from "@/components/cases/case-list";
import { toTrackedCaseSummary } from "@/components/cases/from-dto";
import { AddCaseControl } from "@/components/cases/wired/add-case-control";
import { PageHeader } from "@/components/layout/page-header";
import { TourLauncher } from "@/components/tour/tour-launcher";
import { requireProfile } from "@/server/auth";
import { listTrackedCases } from "@/server/cases/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cases");
  return { title: t("title") };
}

export default async function CasesPage() {
  // Session reads depend on the request; keep them out of any static shell.
  await io();
  const [profile, t] = await Promise.all([requireProfile("client"), getTranslations("cases")]);
  const tracked = await listTrackedCases(profile.id);
  const cases = tracked.map(toTrackedCaseSummary);
  const trackedReceipts = cases.map((c) => c.receiptNumber);
  const now = new Date();

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader
        title={t("title")}
        description={t("greeting", { name: profile.fullName.split(" ")[0] })}
        actions={cases.length > 0 ? <AddCaseControl trackedReceipts={trackedReceipts} /> : undefined}
      />
      <CaseList cases={cases} now={now} addCaseAction={<AddCaseControl trackedReceipts={trackedReceipts} />} />
      <TourLauncher tour="cases" autoStart={!profile.toursCompleted.includes("cases")} />
    </div>
  );
}
