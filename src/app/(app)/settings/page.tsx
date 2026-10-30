import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { requireProfile } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const [profile, t] = await Promise.all([requireProfile(), getTranslations("settings")]);

  return (
    <div className="flex flex-1 flex-col gap-8 fade-up">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-10">
        <SettingsSection title={t("profile.title")} description={t("profile.description")}>
          <SettingsRow label={t("profile.name")}>
            <span className="text-md text-ink">{profile.fullName}</span>
          </SettingsRow>
          <SettingsRow label={t("profile.email")}>
            <span className="text-md text-ink">{profile.email}</span>
          </SettingsRow>
          <SettingsRow label={t("profile.role")} hint={t("profile.roleHint")}>
            <span className="text-md text-ink">{t(`profile.roles.${profile.role}`)}</span>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t("language.title")} description={t("language.description")}>
          <SettingsRow label={t("language.label")}>
            <LanguageSwitch />
          </SettingsRow>
        </SettingsSection>

        {/* Data layer pending: consent, notifications and account deletion sections (see /design for the components). */}
      </div>
    </div>
  );
}
