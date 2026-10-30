import {
  ArrowDownWideNarrowIcon,
  CalendarPlusIcon,
  EyeIcon,
  FolderOpenIcon,
  HistoryIcon,
  LanguagesIcon,
  MailIcon,
  ScaleIcon,
  ShieldOffIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

type Audience = "families" | "attorneys";

const audiences: Record<Audience, { icon: LucideIcon; items: { key: string; icon: LucideIcon }[] }> = {
  families: {
    icon: UserRoundIcon,
    items: [
      { key: "one", icon: FolderOpenIcon },
      { key: "plain", icon: LanguagesIcon },
      { key: "dates", icon: CalendarPlusIcon },
      { key: "email", icon: MailIcon },
    ],
  },
  attorneys: {
    icon: ScaleIcon,
    items: [
      { key: "shared", icon: EyeIcon },
      { key: "urgency", icon: ArrowDownWideNarrowIcon },
      { key: "same", icon: HistoryIcon },
      { key: "revoke", icon: ShieldOffIcon },
    ],
  },
};

/** "For families / for attorneys": the two roles side by side, each with what it gets. */
export function AudienceSplit() {
  const t = useTranslations("landing.audience");

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-12">
      {(Object.keys(audiences) as Audience[]).map((audience) => {
        const { icon: Icon, items } = audiences[audience];
        return (
          <div key={audience} className="border-t border-line pt-6">
            <p className="text-caps flex items-center gap-2 text-ink-muted">
              <Icon className="size-4 text-stamp" aria-hidden="true" />
              {t(`${audience}.label`)}
            </p>
            <h3 className="text-heading mt-3 max-w-[28ch] text-ink">{t(`${audience}.title`)}</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {items.map(({ key, icon: ItemIcon }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-ink">
                    <ItemIcon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-md text-ink-muted">{t(`${audience}.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
