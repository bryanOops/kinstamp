import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthBackdrop } from "@/components/layout/auth-backdrop";
import { Container } from "@/components/layout/container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signUp");
  return { title: t("metaTitle") };
}

export default async function SignUpPage() {
  const t = await getTranslations("auth.signUp");

  return (
    <AuthBackdrop>
      <Container className="py-10 sm:py-16">
        <AuthCard title={t("title")} description={t("description")}>
          <SignUpForm />
        </AuthCard>
      </Container>
    </AuthBackdrop>
  );
}
