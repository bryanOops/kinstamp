import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StampMark } from "@/components/brand/logo";
import { AudienceSplit } from "@/components/landing/audience-split";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingCaseMock } from "@/components/landing/landing-case-mock";
import { PrivacyLedger } from "@/components/landing/privacy-ledger";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const benefits = ["history", "share", "plain", "slow"] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="flex flex-col">
      {/* Hero: headline, subhead, both calls to action and the product itself on the right. */}
      <section aria-labelledby="hero-title" className="border-b border-line">
        <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-24">
          <div className="max-w-[34rem] fade-up">
            <p className="text-caps flex items-center gap-2 text-ink-muted">
              <StampMark className="size-4 text-ink" />
              {t("hero.eyebrow")}
            </p>
            <h1 id="hero-title" className="text-display mt-5 text-ink sm:text-[3.5rem] sm:leading-[1.04]">
              {t("hero.title")}
            </h1>
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
          <LandingCaseMock />
        </Container>
      </section>

      {/* Who it is for: the two roles side by side. */}
      <section aria-labelledby="audience-title" className="border-b border-line bg-surface">
        <Container className="py-14 sm:py-20">
          <h2 id="audience-title" className="text-title max-w-[26ch] text-ink">
            {t("audience.title")}
          </h2>
          <AudienceSplit />
        </Container>
      </section>

      {/* How it works: three numbered steps with a vignette each. */}
      <section aria-labelledby="how-title" className="border-b border-line">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16">
            <div>
              <h2 id="how-title" className="text-title text-ink">
                {t("how.title")}
              </h2>
              <p className="mt-3 text-md text-ink-muted">{t("how.subtitle")}</p>
            </div>
            <HowItWorks />
          </div>
        </Container>
      </section>

      {/* What you get. */}
      <section aria-labelledby="benefits-title" className="border-b border-line bg-surface">
        <Container className="py-14 sm:py-20">
          <h2 id="benefits-title" className="text-title max-w-[22ch] text-ink">
            {t("benefits.title")}
          </h2>
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

      {/* Privacy: the mental model in two sentences, then the public/private ledger. */}
      <section aria-labelledby="privacy-title" className="border-b border-line">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-start">
            <div className="max-w-[46rem]">
              <h2 id="privacy-title" className="text-title text-ink">
                {t("privacy.title")}
              </h2>
              <p className="mt-4 text-md text-ink-muted">{t("privacy.public")}</p>
              <p className="mt-3 text-md text-ink-muted">{t("privacy.private")}</p>
            </div>
            <PrivacyLedger />
          </div>
        </Container>
      </section>

      {/* Closing call to action on ink. */}
      <section aria-labelledby="closing-title" className="bg-ink text-white">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
            <div className="max-w-[40rem]">
              <h2 id="closing-title" className="text-title text-white">
                {t("closing.title")}
              </h2>
              <p className="mt-3 max-w-[60ch] text-md text-white/70">{t("closing.body")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <Link href="/sign-up" className={cn(buttonVariants({ variant: "inverse", size: "lg" }), "focus-visible:ring-white")}>
                {t("closing.cta")}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex min-h-11 items-center rounded-md px-2 text-md font-medium text-white underline underline-offset-4 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
              >
                {t("closing.secondary")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
