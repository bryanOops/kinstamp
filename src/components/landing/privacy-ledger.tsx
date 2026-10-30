import { CheckIcon, GlobeIcon, LockIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const sides: { key: "uscis" | "kinstamp"; icon: LucideIcon }[] = [
  { key: "uscis", icon: GlobeIcon },
  { key: "kinstamp", icon: LockIcon },
];

/** Two short lists that make the mental model concrete: what is public at USCIS, what Kinstamp keeps private. */
export function PrivacyLedger() {
  const t = useTranslations("landing.privacy.ledger");

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {sides.map(({ key, icon: Icon }) => (
        <div key={key} className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <p className="text-caps flex items-center gap-2 text-ink-muted">
            <Icon className={key === "kinstamp" ? "size-4 text-stamp" : "size-4"} aria-hidden="true" />
            {t(`${key}.title`)}
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {(["1", "2", "3"] as const).map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>{t(`${key}.items.${item}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
