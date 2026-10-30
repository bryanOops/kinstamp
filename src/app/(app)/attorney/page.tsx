import { BriefcaseIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/empty-state";
import { requireProfile } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("attorney");
  return { title: t("title") };
}

export default async function AttorneyPage() {
  const [profile, t] = await Promise.all([requireProfile("attorney"), getTranslations("attorney")]);

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("description")} />
      {/* Data layer pending: the shared-cases table is wired here. */}
      <EmptyState
        icon={BriefcaseIcon}
        title={t("empty.title")}
        description={
          <>
            {t("empty.description")}{" "}
            <span className="font-medium text-ink">{profile.email}</span>
          </>
        }
      />
    </div>
  );
}
