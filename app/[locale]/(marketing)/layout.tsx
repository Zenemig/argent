import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "marketing.nav" });

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/" />
      <link rel="alternate" hrefLang="es" href="/es" />
      <link rel="alternate" hrefLang="x-default" href="/" />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href={locale === "en" ? "/" : `/${locale}`} className="flex items-center gap-2 text-foreground">
            <LogoIcon className="h-6" />
            <span className="text-sm font-semibold">Argent</span>
          </Link>
          <Link
            href="/gear"
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("openApp")}
          </Link>
        </div>
      </header>
      <div className="pt-14">
        {children}
      </div>
    </>
  );
}
