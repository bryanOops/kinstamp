"use client";

import { useOptimistic, useTransition } from "react";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { DangerSection, NotificationsSection, PrivacySection } from "@/components/settings/settings-sections";
import { deleteAccount, setInsightsConsent, setNotifyOnChange } from "@/server/actions/cases";

type SettingsControlsProps = {
  email: string;
  consentGrantedAt: string | null;
  notifyOnChange: boolean;
  /** Reference instant for the optimistic consent date. */
  now: Date;
};

/** Consent, notifications and account deletion wired to their Server Actions, with optimistic toggles. */
export function SettingsControls({ email, consentGrantedAt, notifyOnChange, now }: SettingsControlsProps) {
  const [consentPending, startConsent] = useTransition();
  const [notifyPending, startNotify] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [optimisticConsent, setOptimisticConsent] = useOptimistic(consentGrantedAt);
  const [optimisticNotify, setOptimisticNotify] = useOptimistic(notifyOnChange);

  return (
    <>
      <PrivacySection
        consentGrantedAt={optimisticConsent}
        pending={consentPending}
        onConsentChange={(granted) =>
          startConsent(async () => {
            setOptimisticConsent(granted ? now.toISOString() : null);
            await setInsightsConsent(granted);
          })
        }
      />
      <NotificationsSection
        notifyOnChange={optimisticNotify}
        pending={notifyPending}
        onChange={(enabled) =>
          startNotify(async () => {
            setOptimisticNotify(enabled);
            await setNotifyOnChange(enabled);
          })
        }
      />
      <DangerSection deleteTrigger={<DeleteAccountDialog email={email} pending={deletePending} onConfirm={() => startDelete(() => deleteAccount())} />} />
    </>
  );
}
