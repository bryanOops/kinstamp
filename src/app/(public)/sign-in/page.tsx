import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Container } from "@/components/layout/container";
import { safeNextPath } from "@/lib/auth/schemas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn");
  return { title: t("metaTitle") };
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const [params, t] = await Promise.all([searchParams, getTranslations("auth.signIn")]);
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
  const error = params.error === "confirmation" ? "confirmation" : null;

  return (
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
        <SignInForm next={next} urlError={error} />
      </AuthCard>
    </Container>
  );
}
