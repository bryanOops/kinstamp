import { NotFoundState } from "@/components/layout/not-found-state";

export default function CaseNotFound() {
  return <NotFoundState forCase back={{ href: "/cases", label: "backToCases" }} />;
}
