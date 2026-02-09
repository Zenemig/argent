import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <main>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
    </main>
  );
}
