import { notFound } from "next/navigation";
import { DesignGallery } from "@/components/design/gallery";
import { AppTopBarFrame } from "@/components/layout/app-top-bar";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";

/** Dev-only gallery of every presentational component with sample data. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <AppTopBarFrame />
      <main className="flex flex-1 flex-col">
        <Container className="py-8 sm:py-10">
          <DesignGallery />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
