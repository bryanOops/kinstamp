"use client";

import { Container } from "@/components/layout/container";
import { RouteError } from "@/components/layout/route-error";

/** Catches errors outside the app routes (landing, sign-in, sign-up) that have no closer boundary. */
export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Container className="flex flex-1 flex-col justify-center py-16">
      <RouteError {...props} />
    </Container>
  );
}
