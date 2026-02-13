import { useTranslations } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { WifiOff, FileCode, Globe, FolderOpen, Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/marketing/reveal";

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

const FEATURE_ICONS = {
  offline: WifiOff,
  xmp: FileCode,
  crossPlatform: Globe,
  openData: FolderOpen,
} as const;

const HOW_IT_WORKS_IMAGES = {
  step1: "/images/how-it-works-log.png",
  step2: "/images/how-it-works-develop.png",
  step3: "/images/how-it-works-export.png",
} as const;

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
    <main id="main-content" className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center">
        <Image
          src="/images/hero-photographer.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/70 to-background" />
        <div className="relative z-10">
          <Logo className="mx-auto mb-8 h-14 text-zinc-300 sm:h-20 animate-fade-up" />
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl animate-fade-up [animation-delay:150ms]">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-up [animation-delay:300ms]">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex justify-center gap-4 animate-fade-up [animation-delay:450ms]">
            <Link
              href="/login?mode=signup"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            >
              {t("hero.cta")}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-border bg-background/50 px-6 py-3 text-sm font-semibold backdrop-blur transition-all duration-200 hover:bg-accent hover:border-zinc-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            >
              {t("hero.learnMore")}
            </a>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="leatherette relative overflow-hidden bg-muted/50 px-4 py-24">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
        <Reveal className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="text-6xl font-serif text-amber-500/20 leading-none select-none">&ldquo;</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {t("problem.title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("problem.description")}
          </p>
        </Reveal>
      </section>

      {/* Features */}
      <section className="relative px-4 py-24">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background via-transparent to-background" />
        <div className="relative z-10 mx-auto grid max-w-5xl gap-8 sm:grid-cols-2">
          {(["offline", "xmp", "crossPlatform", "openData"] as const).map(
            (key, i) => {
              const Icon = FEATURE_ICONS[key];
              return (
                <Reveal key={key} delay={i * 100}>
                  <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-zinc-600 hover:shadow-lg hover:-translate-y-1">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl transition-all group-hover:bg-amber-500/10" />
                    <div className="relative">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <Icon className="h-5 w-5 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {t(`features.${key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(`features.${key}.description`)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            },
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="leatherette bg-muted/50 px-4 py-24">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">
              {t("howItWorks.title")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {(["step1", "step2", "step3"] as const).map((step, i) => (
              <Reveal key={step} delay={i * 150}>
                <div className="group flex flex-col items-center">
                  <div className="relative mb-6 aspect-square w-48 overflow-hidden rounded-2xl">
                    <Image
                      src={HOW_IT_WORKS_IMAGES[step]}
                      alt={t(`howItWorks.${step}.title`)}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">
                    {t(`howItWorks.${step}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`howItWorks.${step}.description`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative px-4 py-24">
        <Image
          src="/images/pricing-notebook.png"
          alt=""
          fill
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background via-transparent to-background" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">
              {t("pricing.title")}
            </h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2">
            {/* Free Tier */}
            <Reveal>
            <div className="flex h-full flex-col gap-8 rounded-xl border border-border bg-card p-8 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div>
                <h3 className="text-2xl font-bold">{t("pricing.free")}</h3>
                <p className="mt-2 text-3xl font-bold">$0</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {(["logging", "gear", "lifecycle", "export", "stats", "offline"] as const).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-amber-500/80" />
                    {t(`pricing.freeFeatures.${feature}`)}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-auto block rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
              >
                {t("pricing.getStarted")}
              </Link>
            </div>
            </Reveal>
            {/* Pro Tier */}
            <Reveal delay={150}>
            <div className="flex h-full flex-col gap-8 rounded-xl border border-amber-500/40 bg-card p-8 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1 hover:border-amber-500/60">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{t("pricing.pro")}</h3>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
                    Soon
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold">
                  {t("pricing.comingSoon")}
                </p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {(["everything", "sync", "multiDevice", "backup", "support"] as const).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-amber-500/80" />
                    {t(`pricing.proFeatures.${feature}`)}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?mode=signup&interest=pro"
                className="mt-auto block rounded-xl border border-border px-6 py-3 text-center text-sm font-semibold transition-all duration-200 hover:bg-accent hover:border-zinc-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
              >
                {t("pricing.joinWaitlist")}
              </Link>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

    </main>
  );
}
