import { useTranslations } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Logo, LogoIcon } from "@/components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marketing" });

  return {
    title: `Argent — ${t("hero.title")}`,
    description: t("hero.subtitle"),
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: {
        en: "/",
        es: "/es",
      },
    },
    openGraph: {
      title: `Argent — ${t("hero.title")}`,
      description: t("hero.subtitle"),
      type: "website",
      siteName: "Argent",
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage locale={locale} />;
}

function LandingPage({ locale }: { locale: string }) {
  const t = useTranslations("marketing");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Argent",
    applicationCategory: "PhotographyApplication",
    operatingSystem: "Web",
    description: t("hero.subtitle"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <Logo className="mb-8 h-10 text-zinc-300 sm:h-14" />
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/gear"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {t("hero.cta")}
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold hover:bg-accent"
          >
            {t("hero.learnMore")}
          </a>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-muted/50 px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("problem.title")}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            {t("problem.description")}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
          {(["offline", "xmp", "crossPlatform", "openData"] as const).map(
            (key) => (
              <div
                key={key}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/50 px-4 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("howItWorks.title")}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {(["step1", "step2", "step3"] as const).map((step, i) => (
              <div key={step}>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {t(`howItWorks.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`howItWorks.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("pricing.title")}
          </h2>
          <div className="mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 mx-auto">
            <div className="rounded-xl border border-border bg-card p-8 text-left">
              <h3 className="text-2xl font-bold">{t("pricing.free")}</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <Link
                href="/gear"
                className="mt-6 block rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t("pricing.getStarted")}
              </Link>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-8 text-left">
              <h3 className="text-2xl font-bold">{t("pricing.pro")}</h3>
              <p className="mt-2 text-3xl font-bold">
                {t("pricing.comingSoon")}
              </p>
              <Link
                href={locale === "en" ? "/pricing" : `/${locale}/pricing`}
                className="mt-6 block rounded-xl border border-border px-6 py-3 text-center text-sm font-semibold hover:bg-accent"
              >
                {t("pricing.joinWaitlist")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("footer.madeFor")}
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/Zenemig/argent"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              {t("footer.github")}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
