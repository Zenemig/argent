import { getTranslations } from "next-intl/server";
import { SettingsContent } from "@/components/settings/settings-content";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <SettingsContent />
    </main>
  );
}
