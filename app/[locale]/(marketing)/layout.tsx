import { setRequestLocale } from "next-intl/server";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <link rel="alternate" hrefLang="en" href="/" />
      <link rel="alternate" hrefLang="es" href="/es" />
      <link rel="alternate" hrefLang="x-default" href="/" />
      {children}
    </>
  );
}
