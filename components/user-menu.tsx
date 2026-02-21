"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera, Aperture, Film, LogOut, Settings, Sparkles, MessageSquarePlus } from "lucide-react";
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
import { clearGlobalAvatarKey } from "@/lib/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";

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
  avatarUrl?: string | null;
}

export function UserMenu({ userId, email, tier, displayName, avatarUrl }: UserMenuProps) {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const tUpgrade = useTranslations("upgrade");
  const [pending, startTransition] = useTransition();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !avatarUrl && avatar.bgColor,
          )}
          aria-label={displayName || email}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className={cn("h-4 w-4", avatar.iconColor)} />
          )}
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
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            {tNav("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setFeedbackOpen(true)}>
          <MessageSquarePlus className="h-4 w-4" />
          {tNav("sendFeedback")}
        </DropdownMenuItem>
        {tier === "free" && (
          <DropdownMenuItem disabled={pending} onSelect={handleJoinWaitlist}>
            <Sparkles className="h-4 w-4" />
            {tUpgrade("getProWhenReady")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => startTransition(async () => {
            await clearGlobalAvatarKey();
            await signOut();
          })}
          disabled={pending}
        >
          <LogOut className="h-4 w-4" />
          {tNav("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
