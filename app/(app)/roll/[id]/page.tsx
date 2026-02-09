import { getTranslations } from "next-intl/server";

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
      <h1 className="text-2xl font-bold">
        {t("title")} #{id.slice(0, 8)}
      </h1>
      <p className="mt-4 text-muted-foreground">{t("selectCamera")}</p>
    </main>
  );
}
