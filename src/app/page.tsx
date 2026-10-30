import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("app");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 px-6">
      <h1 className="font-serif text-6xl tracking-tight">{t("name")}</h1>
      <p className="text-lg text-ink-muted">{t("tagline")}</p>
    </main>
  );
}
