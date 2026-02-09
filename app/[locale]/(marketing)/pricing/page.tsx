import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

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
            <li>✓ Shot logging</li>
            <li>✓ Gear management</li>
            <li>✓ Roll lifecycle tracking</li>
            <li>✓ XMP, CSV, JSON export</li>
            <li>✓ Statistics</li>
            <li>✓ Full offline support</li>
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
          <p className="mt-2 text-3xl font-bold">
            {t("comingSoon")}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>✓ Everything in Free</li>
            <li>✓ Cloud sync</li>
            <li>✓ Multi-device access</li>
            <li>✓ Reference image cloud backup</li>
            <li>✓ Priority support</li>
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
