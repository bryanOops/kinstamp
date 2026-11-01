import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/status/empty-state";
import { buttonVariants } from "@/components/ui/button";

type NotFoundStateProps = {
  /** Where the button goes, and its label key under `notFound`. */
  back: { href: string; label: "home" | "backToCases" | "backToClientsCases" };
  /** Explains a missing case instead of a missing page. */
  forCase?: boolean;
};

/** Translated 404 content for the root and for case routes. */
export function NotFoundState({ back, forCase = false }: NotFoundStateProps) {
  const t = useTranslations("notFound");
  return (
    <Container className="flex flex-1 flex-col justify-center py-16">
      <EmptyState
        icon={SearchXIcon}
        title={forCase ? t("caseTitle") : t("title")}
        description={forCase ? t("caseDescription") : t("description")}
        action={
          <Link href={back.href} className={buttonVariants({ variant: "secondary" })}>
            {t(back.label)}
          </Link>
        }
      />
    </Container>
  );
}
