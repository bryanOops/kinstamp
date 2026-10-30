import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { StickyHeader } from "@/components/layout/sticky-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Header for the landing and auth pages: light, quiet, two actions. */
export function PublicHeader({ minimal = false }: { minimal?: boolean }) {
  const t = useTranslations("nav");
  return (
    <StickyHeader tone="light">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitch />
          {!minimal && (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
                {t("signIn")}
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                {t("createAccount")}
              </Link>
            </>
          )}
        </div>
      </Container>
    </StickyHeader>
  );
}
