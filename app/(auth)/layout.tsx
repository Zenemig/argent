import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SkipLink } from "@/components/skip-link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SkipLink />
      <main id="main-content" className="flex min-h-screen items-center justify-center px-4">
        {children}
      </main>
    </NextIntlClientProvider>
  );
}
