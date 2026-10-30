import { FolderOpenIcon } from "lucide-react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/status/empty-state";
import { requireProfile } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cases");
  return { title: t("title") };
}

export default async function CasesPage() {
  // Session reads depend on the request; keep them out of any static shell.
  await io();
  const [profile, t] = await Promise.all([requireProfile("client"), getTranslations("cases")]);

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("greeting", { name: profile.fullName.split(" ")[0] })} />
      {/* Data layer pending: the tracked-case list and the "Add a case" dialog are wired here. */}
      <EmptyState icon={FolderOpenIcon} title={t("empty.title")} description={t("empty.description")} />
    </div>
  );
}
