import { getTranslations } from "next-intl/server";
import { RollDetail } from "@/components/roll/roll-detail";

export async function generateMetadata() {
  const t = await getTranslations("roll");
  return { title: t("title") };
}

export default async function RollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("roll");

  return (
    <main>
      <h1 className="sr-only">{t("title")}</h1>
      <RollDetail rollId={id} />
    </main>
  );
}
