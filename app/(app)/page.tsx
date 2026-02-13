import { getTranslations } from "next-intl/server";
import { DashboardContent } from "@/components/roll/dashboard-content";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const t = await getTranslations("nav");

  return (
    <main>
      <h1 className="sr-only">{t("dashboard")}</h1>
      <DashboardContent />
    </main>
  );
}
