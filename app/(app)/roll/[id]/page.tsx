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

  return (
    <main>
      <RollDetail rollId={id} />
    </main>
  );
}
