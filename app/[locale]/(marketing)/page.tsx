import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage />;
}

function LandingPage() {
  const t = useTranslations("marketing");

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
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
            )
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

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {t("footer.madeFor")}
          </p>
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
