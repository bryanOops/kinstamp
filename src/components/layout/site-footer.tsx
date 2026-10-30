import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="flex flex-col gap-3 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden text-ink-disabled sm:inline" aria-hidden="true">
            ·
          </span>
          <span>{t("tagline")}</span>
        </div>
        <p>{t("notAffiliated")}</p>
      </Container>
    </footer>
  );
}
