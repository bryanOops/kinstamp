import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthBackdrop } from "@/components/layout/auth-backdrop";
import { Container } from "@/components/layout/container";
import { z } from "zod";
import { getShareInvitation } from "@/server/cases/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signUp");
  return { title: t("metaTitle") };
}

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const t = await getTranslations("auth.signUp");
  // An invitation link from a share email: prefill the attorney's email and role.
  const inviteId = z.uuid().safeParse((await searchParams).invite);
  const invitation = inviteId.success ? await getShareInvitation(inviteId.data) : null;

  return (
    <AuthBackdrop>
      <Container className="py-10 sm:py-16">
        <AuthCard title={invitation ? t("invitation.title") : t("title")} description={invitation ? t("invitation.description") : t("description")}>
          <SignUpForm invitation={invitation} />
        </AuthCard>
      </Container>
    </AuthBackdrop>
  );
}
