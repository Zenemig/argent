"use client";

import type { ReactNode } from "react";
import { useUserTier } from "@/hooks/useUserTier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

interface ProGateProps {
  children: ReactNode;
  /** When true, hides the upgrade prompt for non-Pro users (renders nothing). */
  hidePrompt?: boolean;
}

/**
 * Renders children for Pro users. Shows UpgradePrompt for Free users.
 */
export function ProGate({ children, hidePrompt }: ProGateProps) {
  const { tier } = useUserTier();

  if (tier === "pro") return <>{children}</>;

  // Free user
  if (hidePrompt) return null;
  return <UpgradePrompt />;
}
