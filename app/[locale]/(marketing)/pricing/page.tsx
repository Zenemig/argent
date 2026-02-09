import { useTranslations } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing.pricing" });

  return {
    title: `${t("title")} | Argent`,
    description: `Argent ${t("title")} — ${t("free")} & ${t("pro")}`,
    alternates: {
      canonical: locale === "en" ? "/pricing" : `/${locale}/pricing`,
      languages: {
        en: "/pricing",
        es: "/es/pricing",
      },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingContent />;
}

function PricingContent() {
  const t = useTranslations("marketing.pricing");

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-24">
      <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
      <div className="mt-12 grid max-w-4xl gap-8 sm:grid-cols-2">
        {/* Free Tier */}
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-2xl font-bold">{t("free")}</h2>
          <p className="mt-2 text-3xl font-bold">$0</p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>&#10003; Shot logging</li>
            <li>&#10003; Gear management</li>
            <li>&#10003; Roll lifecycle tracking</li>
            <li>&#10003; XMP, CSV, JSON export</li>
            <li>&#10003; Statistics</li>
            <li>&#10003; Full offline support</li>
          </ul>
          <Link
            href="/gear"
            className="mt-8 block rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("getStarted")}
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="rounded-xl border-2 border-primary bg-card p-8">
          <h2 className="text-2xl font-bold">{t("pro")}</h2>
          <p className="mt-2 text-3xl font-bold">{t("comingSoon")}</p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>&#10003; Everything in Free</li>
            <li>&#10003; Cloud sync</li>
            <li>&#10003; Multi-device access</li>
            <li>&#10003; Reference image cloud backup</li>
            <li>&#10003; Priority support</li>
          </ul>
          <button
            type="button"
            className="mt-8 block w-full rounded-xl border border-border px-6 py-3 text-center text-sm font-semibold hover:bg-accent"
          >
            {t("joinWaitlist")}
          </button>
        </div>
      </div>
    </main>
  );
}
