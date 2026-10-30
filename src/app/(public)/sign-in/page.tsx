import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthBackdrop } from "@/components/layout/auth-backdrop";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNextPath, signInReason } from "@/lib/auth/schemas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn");
  return { title: t("metaTitle") };
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const t = await getTranslations("auth.signIn");

  return (
    <AuthBackdrop>
      <Container className="py-10 sm:py-16">
        <AuthCard
          title={t("title")}
          description={t("description")}
          footer={
            <p className="mx-auto max-w-[36ch] rounded-lg border border-line bg-surface/70 px-4 py-3 text-sm text-ink-muted">
              {t("demoNote")}
            </p>
          }
        >
          {/* The URL (next, error, reason) is request data: read it inside Suspense so the card itself stays static. */}
          <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
            <SignInFromParams searchParams={searchParams} />
          </Suspense>
        </AuthCard>
      </Container>
    </AuthBackdrop>
  );
}

async function SignInFromParams({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
  const error = params.error === "confirmation" ? "confirmation" : null;
  const reason = signInReason(Array.isArray(params.reason) ? params.reason[0] : params.reason);
  return <SignInForm next={next} urlError={error} reason={reason} />;
}
