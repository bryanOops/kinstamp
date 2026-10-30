"use client";

import { useEffect, useTransition } from "react";
import { markCaseViewed } from "@/server/actions/cases";

/**
 * Records the visit (for the "changed since your last visit" marker) once the detail is on screen.
 * This is a mutation triggered by the visit itself, not data fetching, so it runs after mount.
 */
export function MarkViewed({ trackedCaseId }: { trackedCaseId: string }) {
  const [, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => markCaseViewed(trackedCaseId));
  }, [trackedCaseId, startTransition]);
  return null;
}
