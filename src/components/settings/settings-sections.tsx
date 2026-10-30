"use client";

import { DownloadIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsRow, SettingsSection } from "./settings-section";

type PrivacySectionProps = {
  /** When consent is active, the date it was granted. */
  consentGrantedAt: string | null;
  onConsentChange?: (granted: boolean) => void;
  onDownloadData?: () => void;
  pending?: boolean;
};

export function PrivacySection({ consentGrantedAt, onConsentChange, onDownloadData, pending }: PrivacySectionProps) {
  const t = useTranslations("settings.privacy");
  const format = useFormatter();
  const id = useId();
  const granted = consentGrantedAt !== null;

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <SettingsRow
        htmlFor={id}
        label={t("consent.label")}
        hint={
          granted
            ? t("consent.grantedAt", { date: format.dateTime(new Date(consentGrantedAt), { month: "long", day: "numeric", year: "numeric" }) })
            : t("consent.hint")
        }
      >
        <Switch id={id} checked={granted} onCheckedChange={onConsentChange} disabled={pending} />
      </SettingsRow>
      <SettingsRow label={t("download.label")} hint={t("download.hint")}>
        <Button variant="outline" size="sm" onClick={onDownloadData} disabled={pending}>
          <DownloadIcon aria-hidden="true" />
          {t("download.button")}
        </Button>
      </SettingsRow>
    </SettingsSection>
  );
}

type NotificationsSectionProps = {
  notifyOnChange: boolean;
  onChange?: (enabled: boolean) => void;
  pending?: boolean;
};

export function NotificationsSection({ notifyOnChange, onChange, pending }: NotificationsSectionProps) {
  const t = useTranslations("settings.notifications");
  const id = useId();
  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <SettingsRow htmlFor={id} label={t("email.label")} hint={t("email.hint")}>
        <Switch id={id} checked={notifyOnChange} onCheckedChange={onChange} disabled={pending} />
      </SettingsRow>
    </SettingsSection>
  );
}

type DangerSectionProps = {
  /** Opens the delete-account confirmation (an AlertDialog owned by the data layer). */
  deleteTrigger: React.ReactNode;
};

export function DangerSection({ deleteTrigger }: DangerSectionProps) {
  const t = useTranslations("settings.danger");
  return (
    <SettingsSection tone="danger" title={t("title")} description={t("description")}>
      <SettingsRow label={t("delete.label")} hint={t("delete.hint")}>
        {deleteTrigger}
      </SettingsRow>
    </SettingsSection>
  );
}
