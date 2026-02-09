import { getTranslations } from "next-intl/server";
import { DashboardContent } from "@/components/roll/dashboard-content";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default function DashboardPage() {
  return (
    <main>
      <DashboardContent />
    </main>
  );
}
