import { Suspense } from "react";
import { AppTopBar, AppTopBarSkeleton } from "@/components/layout/app-top-bar";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Signed-in shell. Pages verify the person themselves with `requireProfile()`;
 * the top bar only reads the profile to decide which navigation to show.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<AppTopBarSkeleton />}>
        <AppTopBar />
      </Suspense>
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col py-8 sm:py-10">{children}</Container>
      </main>
      <SiteFooter />
    </>
  );
}
