"use client";

import { startTransition, useActionState } from "react";
import { RefreshButton } from "@/components/cases/refresh-button";
import { refreshCase, type RefreshState } from "@/server/actions/cases";

type RefreshControlProps = {
  trackedCaseId: string;
  now: Date;
  lastChangeOn: string | null;
  lastSuccessfulCheckAt: string | null;
};

/** Refresh button wired to `refreshCase`; the action re-renders the route when something changed. */
export function RefreshControl({ trackedCaseId, now, lastChangeOn, lastSuccessfulCheckAt }: RefreshControlProps) {
  const [state, dispatch, pending] = useActionState<RefreshState>(refreshCase.bind(null, trackedCaseId), { status: "idle" });
  return (
    <RefreshButton
      state={state}
      pending={pending}
      now={now}
      lastChangeOn={lastChangeOn}
      lastSuccessfulCheckAt={lastSuccessfulCheckAt}
      onRefresh={() => startTransition(() => dispatch())}
    />
  );
}
