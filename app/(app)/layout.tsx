import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DbProvider } from "@/components/db-provider";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DbProvider>
        <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-6">
          {children}
        </div>
        <BottomNav />
        <Toaster />
      </DbProvider>
    </NextIntlClientProvider>
  );
}
