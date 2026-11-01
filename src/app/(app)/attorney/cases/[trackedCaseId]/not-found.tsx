import { NotFoundState } from "@/components/layout/not-found-state";

export default function SharedCaseNotFound() {
  return <NotFoundState forCase back={{ href: "/attorney", label: "backToClientsCases" }} />;
}
