import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { LandingPreview } from "@/components/marketing/landing-preview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const benefits = ["history", "share", "plain", "slow"] as const;
const steps = ["add", "check", "share"] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="flex flex-col">
      <section className="border-b border-line">
        <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-24">
          <div className="max-w-[34rem] fade-up">
            <h1 className="text-display text-ink sm:text-[3.5rem] sm:leading-[1.04]">{t("hero.title")}</h1>
            <p className="mt-6 max-w-[42ch] text-lg text-ink-muted">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                {t("hero.cta")}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                {t("hero.secondary")}
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-muted">{t("hero.note")}</p>
          </div>
          <LandingPreview />
        </Container>
      </section>

      <section className="border-b border-line bg-surface">
        <Container className="py-14 sm:py-20">
          <h2 className="text-title max-w-[22ch] text-ink">{t("benefits.title")}</h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {benefits.map((key) => (
              <div key={key} className="border-t border-line pt-5">
                <dt className="text-subheading text-ink">{t(`benefits.${key}.title`)}</dt>
                <dd className="mt-1.5 max-w-[46ch] text-md text-ink-muted">{t(`benefits.${key}.body`)}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <div>
              <h2 className="text-title text-ink">{t("how.title")}</h2>
              <p className="mt-3 text-md text-ink-muted">{t("how.subtitle")}</p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {steps.map((key, index) => (
                <li key={key} className="flex flex-col gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-sm font-semibold tabular text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-subheading mt-2 text-ink">{t(`how.${key}.title`)}</h3>
                  <p className="text-sm text-ink-muted">{t(`how.${key}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="max-w-[46rem]">
              <h2 className="text-title text-ink">{t("privacy.title")}</h2>
              <p className="mt-3 text-md text-ink-muted">{t("privacy.body")}</p>
            </div>
            <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "justify-self-start md:justify-self-end")}>
              {t("hero.cta")}
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
