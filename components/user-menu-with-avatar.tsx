"use client";

import { useAvatar } from "@/hooks/useAvatar";
import { UserMenu } from "@/components/user-menu";

interface UserMenuWithAvatarProps {
  userId: string;
  email: string;
  tier: "free" | "pro";
  displayName?: string | null;
}

export function UserMenuWithAvatar(props: UserMenuWithAvatarProps) {
  const avatarUrl = useAvatar();
  return <UserMenu {...props} avatarUrl={avatarUrl} />;
}
