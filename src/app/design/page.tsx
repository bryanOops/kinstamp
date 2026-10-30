import { notFound } from "next/navigation";

/** Dev-only gallery of every presentational component with sample data. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return null;
}
