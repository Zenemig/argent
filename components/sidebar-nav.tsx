"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, BarChart3, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/nav-helpers";
import { Logo } from "@/components/logo";
import { SyncStatus } from "@/components/sync-status";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "dashboard" as const, isHome: true },
  { href: "/gear", icon: Camera, labelKey: "gear" as const },
  { href: "/stats", icon: BarChart3, labelKey: "stats" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

interface SidebarNavProps {
  userMenu?: React.ReactNode;
}

export function SidebarNav({ userMenu }: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-background">
      <div className="flex h-14 items-center px-6">
        <Logo className="h-5 text-muted-foreground" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item.href, !!item.isHome, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.labelKey}
              href={item.isHome ? "/" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 space-y-3">
        <SyncStatus />
        {userMenu}
      </div>
    </aside>
  );
}
