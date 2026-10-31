"use client";

import { useActionState } from "react";
import { AddCaseDialog } from "@/components/cases/add-case-dialog";
import { addCase, type AddCaseState } from "@/server/actions/cases";

/** "Add a case" trigger + dialog wired to the `addCase` Server Action. */
export function AddCaseControl({ trackedReceipts }: { trackedReceipts?: readonly string[] }) {
  const [state, action] = useActionState<AddCaseState, FormData>(addCase, {});
  return <AddCaseDialog action={action} state={state} trackedReceipts={trackedReceipts} />;
}
