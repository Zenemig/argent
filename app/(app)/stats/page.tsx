import { getTranslations } from "next-intl/server";
import { StatsContent } from "@/components/stats/stats-content";

export async function generateMetadata() {
  const t = await getTranslations("stats");
  return { title: t("title") };
}

export default function StatsPage() {
  return (
    <main>
      <StatsContent />
    </main>
  );
}
