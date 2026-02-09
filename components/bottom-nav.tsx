"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, BarChart3, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/nav-helpers";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "dashboard" as const, isHome: true },
  { href: "/gear", icon: Camera, labelKey: "gear" as const },
  { href: "/stats", icon: BarChart3, labelKey: "stats" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item.href, !!item.isHome, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.labelKey}
              href={item.isHome ? "/" : item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
