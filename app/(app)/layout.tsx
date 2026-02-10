import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DbProvider } from "@/components/db-provider";
import { UserTierProvider } from "@/hooks/useUserTier";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/logo";
import { SyncStatus } from "@/components/sync-status";

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
        <UserTierProvider>
          <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Logo className="h-5 text-muted-foreground" />
              <SyncStatus />
            </div>
            {children}
          </div>
          <BottomNav />
          <Toaster />
        </UserTierProvider>
      </DbProvider>
    </NextIntlClientProvider>
  );
}
