import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SkipLink } from "@/components/skip-link";
import { LocaleToggle } from "@/components/marketing/locale-toggle";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "marketing" });

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/" />
      <link rel="alternate" hrefLang="es" href="/es" />
      <link rel="alternate" hrefLang="x-default" href="/" />
      <SkipLink />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={locale === "en" ? "/" : `/${locale}`} className="text-foreground hover:opacity-80">
            <Logo className="h-7" />
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Zenemig/argent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("footer.github")}
            </a>
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
            >
              {t("nav.signup")}
            </Link>
            <LocaleToggle currentLocale={locale} />
          </div>
        </div>
      </header>
      <div className="pt-14">
        {children}
      </div>
    </>
  );
}
