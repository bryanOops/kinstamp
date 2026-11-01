import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { KeyDateFragment } from "@/components/landing/key-date-fragment";
import { LandingCaseMock } from "@/components/landing/landing-case-mock";
import { Moment } from "@/components/landing/moment";
import { ShareFragment } from "@/components/landing/share-fragment";
import { SlowFragment } from "@/components/landing/slow-fragment";
import { TimelineFragment } from "@/components/landing/timeline-fragment";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

const textLink =
  "inline-flex min-h-11 items-center rounded-md px-1 text-md font-medium text-ink underline underline-offset-4 hover:text-stamp-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="flex flex-col">
      {/* Hero: one idea set large, the product itself as the object, hanging over the fold from lg. */}
      <section aria-labelledby="hero-title">
        <Container className="grid gap-12 pt-12 pb-14 sm:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16 lg:pt-20 lg:pb-0">
          <div className="fade-up lg:pt-6">
            <h1
              id="hero-title"
              className="text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.03em] text-ink sm:text-[3.5rem] lg:text-[4rem]"
            >
              {t("hero.title")}
            </h1>
            <p className="mt-7 max-w-[40ch] text-lg leading-relaxed text-ink-muted">{t("hero.subtitle")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                {t("hero.cta")}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link href="/sign-in" className={textLink}>
                {t("hero.secondary")}
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-subtle">{t("hero.note")}</p>
          </div>
          <LandingCaseMock className="relative z-10 lg:-mb-20" />
        </Container>
      </section>

      {/* Four things the product does, each shown with the product itself. */}
      <Moment id="timeline" title={t("timeline.title")} body={t("timeline.body")} layout="wide" tone="surface" className="lg:pt-12">
        <TimelineFragment />
      </Moment>

      <Moment id="share" title={t("share.title")} body={t("share.body")} layout="flipped">
        <ShareFragment />
      </Moment>

      <Moment id="key-dates" title={t("keyDates.title")} body={t("keyDates.body")} layout="stacked" tone="surface">
        <KeyDateFragment />
      </Moment>

      <Moment id="slow" title={t("slow.title")} body={t("slow.body")} layout="flipped">
        <SlowFragment />
      </Moment>

      {/* Privacy: the public board and the private notebook, said in type. */}
      <section aria-labelledby="privacy-title" className="border-t border-line bg-surface">
        <Container className="py-16 sm:py-20 lg:py-28">
          <h2 id="privacy-title" className="text-title text-ink">
            {t("privacy.title")}
          </h2>
          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-x-16">
            <p className="max-w-[34ch] text-[1.5rem] leading-[1.3] tracking-[-0.016em] text-ink-muted sm:text-[1.75rem]">
              <strong className="font-semibold text-ink">{t("privacy.publicLead")}</strong> {t("privacy.public")}
            </p>
            <p className="max-w-[34ch] border-t border-line pt-10 text-[1.5rem] leading-[1.3] tracking-[-0.016em] text-ink-muted sm:text-[1.75rem] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
              <strong className="font-semibold text-ink">{t("privacy.privateLead")}</strong> {t("privacy.private")}
            </p>
          </div>
          <p className="mt-10 max-w-[60ch] text-sm text-ink-muted lg:mt-12">{t("privacy.insights")}</p>
        </Container>
      </section>

      {/* Closing: the call to action, quietly, with the honest sandbox note. */}
      <section aria-labelledby="closing-title" className="border-t border-line">
        <Container className="py-16 sm:py-20 lg:py-28">
          <div className="max-w-[40rem]">
            <h2 id="closing-title" className="text-title text-ink">
              {t("closing.title")}
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                {t("closing.cta")}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link href="/sign-in" className={textLink}>
                {t("closing.secondary")}
              </Link>
            </div>
            <p className="mt-8 max-w-[58ch] text-sm text-ink-muted">{t("closing.body")}</p>
          </div>
        </Container>
      </section>
    </div>
  );
}
