import { getTranslations } from "next-intl/server";
import { GearTabs } from "@/components/gear/gear-tabs";

export async function generateMetadata() {
  const t = await getTranslations("gear");
  return { title: t("title") };
}

export default async function GearPage() {
  const t = await getTranslations("gear");

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <GearTabs />
    </main>
  );
}
