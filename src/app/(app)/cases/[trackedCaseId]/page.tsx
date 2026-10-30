import { FileSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("caseDetail");
  return { title: t("title") };
}

export default async function CaseDetailPage({ params }: PageProps<"/cases/[trackedCaseId]">) {
  const [{ trackedCaseId }, t] = await Promise.all([params, getTranslations("caseDetail")]);
  await requireProfile("client");

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader breadcrumbs={[{ label: t("breadcrumbCases"), href: "/cases" }, { label: t("title") }]} title={t("title")} />
      {/* Data layer pending: the tracked case `trackedCaseId` is loaded here and rendered with the case components. */}
      <EmptyState
        icon={FileSearchIcon}
        title={t("notFound.title")}
        description={t("notFound.description", { id: trackedCaseId })}
        action={
          <Link href="/cases" className={buttonVariants({ variant: "secondary" })}>
            {t("notFound.back")}
          </Link>
        }
      />
    </div>
  );
}
