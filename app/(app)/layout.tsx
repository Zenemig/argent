import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DbProvider } from "@/components/db-provider";
import { UserTierProvider } from "@/hooks/useUserTier";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/logo";
import { SyncStatus } from "@/components/sync-status";
import { UserMenu } from "@/components/user-menu";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tier: "free" | "pro" = "free";
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("tier, display_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      tier = profile.tier === "pro" ? "pro" : "free";
      displayName = profile.display_name;
    }
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DbProvider>
        <UserTierProvider>
          <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Logo className="h-5 text-muted-foreground" />
              <div className="flex-1" />
              <SyncStatus />
              {user && (
                <UserMenu
                  userId={user.id}
                  email={user.email ?? ""}
                  tier={tier}
                  displayName={displayName}
                />
              )}
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
