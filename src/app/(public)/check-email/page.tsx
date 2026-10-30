import { MailCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.checkEmail");
  return { title: t("metaTitle") };
}

const emailParam = z.email();

export default function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  return (
    <Container className="py-10 sm:py-16">
      <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-[460px] rounded-2xl" />}>
        <CheckEmailCard searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function CheckEmailCard({ searchParams }: Pick<PageProps<"/check-email">, "searchParams">) {
  const [params, t] = await Promise.all([searchParams, getTranslations("auth.checkEmail")]);
  const raw = Array.isArray(params.email) ? params.email[0] : params.email;
  const parsed = emailParam.safeParse(raw);
  const email = parsed.success ? parsed.data : null;

  return (
    <AuthCard
      title={t("title")}
      description={
        email
          ? t.rich("sentTo", { email, strong: (chunks) => <strong className="font-semibold text-ink">{chunks}</strong> })
          : t("sentGeneric")
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/60 p-4">
          <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
          <div className="text-sm text-ink-muted">
            <p className="font-medium text-ink">{t("nextStepTitle")}</p>
            <p className="mt-1">{t("nextStep")}</p>
            <p className="mt-2">{t("spam")}</p>
          </div>
        </div>
        <Link href="/sign-in" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          {t("goToSignIn")}
        </Link>
      </div>
    </AuthCard>
  );
}
