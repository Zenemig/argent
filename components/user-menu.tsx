"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera, Aperture, Film, LogOut, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserAvatar, type AvatarIcon } from "@/lib/user-avatar";
import { signOut, joinWaitlist } from "@/app/(app)/settings/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICON_MAP = {
  camera: Camera,
  aperture: Aperture,
  film: Film,
} as const satisfies Record<AvatarIcon, typeof Camera>;

interface UserMenuProps {
  userId: string;
  email: string;
  tier: "free" | "pro";
  displayName?: string | null;
}

export function UserMenu({ userId, email, tier, displayName }: UserMenuProps) {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const tUpgrade = useTranslations("upgrade");
  const [pending, startTransition] = useTransition();
  const avatar = getUserAvatar(userId);
  const Icon = ICON_MAP[avatar.icon];

  function handleJoinWaitlist() {
    startTransition(async () => {
      const result = await joinWaitlist();
      if (result.success) {
        toast.success(tUpgrade("waitlistConfirmed"));
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            avatar.bgColor,
          )}
          aria-label={displayName || email}
        >
          <Icon className={cn("h-4 w-4", avatar.iconColor)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            {displayName && (
              <p className="text-sm font-medium">{displayName}</p>
            )}
            <p className="text-xs text-muted-foreground">{email}</p>
            <Badge
              variant={tier === "pro" ? "default" : "secondary"}
              className="w-fit"
            >
              {tier === "pro" ? t("tierPro") : t("tierFree")}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tier === "free" && (
          <DropdownMenuItem disabled={pending} onSelect={handleJoinWaitlist}>
            <Sparkles className="h-4 w-4" />
            {tUpgrade("getProWhenReady")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              {tNav("signOut")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
