import { io } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentProfile, homePathFor } from "@/server/auth";

/**
 * Black top bar for signed-in screens. Navigation depends on the role:
 * clients see Cases, Insights, Settings; attorneys see Clients' cases, Settings.
 */
export async function AppTopBar() {
  await io();
  const [profile, t] = await Promise.all([getCurrentProfile(), getTranslations("nav")]);
  if (!profile) return <AppTopBarFrame />;

  const items: NavItem[] =
    profile.role === "attorney"
      ? [
          { href: "/attorney", label: t("clientsCases") },
          { href: "/settings", label: t("settings") },
        ]
      : [
          { href: "/cases", label: t("cases") },
          { href: "/insights", label: t("insights") },
          { href: "/settings", label: t("settings") },
        ];

  return (
    <AppTopBarFrame
      home={homePathFor(profile.role)}
      nav={<NavLinks items={items} className="h-full" />}
      right={
        <>
          <LanguageSwitch tone="onDark" />
          <UserMenu fullName={profile.fullName} email={profile.email} role={profile.role} />
        </>
      }
    />
  );
}

export function AppTopBarFrame({
  home = "/",
  nav,
  right,
}: {
  home?: string;
  nav?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="bg-ink text-white">
      <Container className="flex h-14 items-center gap-6">
        <Link
          href={home}
          className="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
        >
          <Logo tone="onDark" />
        </Link>
        <div className="hidden h-full flex-1 md:block">{nav}</div>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </Container>
      {nav && (
        <div className="border-t border-white/10 md:hidden">
          <Container className="h-11 overflow-x-auto no-scrollbar">{nav}</Container>
        </div>
      )}
    </header>
  );
}

export function AppTopBarSkeleton() {
  return (
    <AppTopBarFrame
      right={<span aria-hidden="true" className="block h-9 w-40 rounded-lg bg-white/10" />}
    />
  );
}
