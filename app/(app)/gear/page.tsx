import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("gear");
  return { title: t("title") };
}

export default async function GearPage() {
  const t = await getTranslations("gear");

  return (
    <main>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("emptyCamera")}</p>
    </main>
  );
}
