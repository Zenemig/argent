"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useUserId } from "@/hooks/useUserId";
import { GUEST_USER_ID } from "@/lib/guest";
import { createClient } from "@/lib/supabase/client";
import type { UserTier } from "@/lib/constants";

interface UserTierState {
  tier: UserTier;
  isProUser: boolean;
  isAuthenticated: boolean;
}

const UserTierContext = createContext<UserTierState | null>(null);

export function UserTierProvider({ children }: { children: ReactNode }) {
  const userId = useUserId();
  const [tier, setTier] = useState<UserTier>("free");

  const isGuest = userId === GUEST_USER_ID;

  useEffect(() => {
    if (isGuest) {
      setTier("free");
      return;
    }

    let cancelled = false;

    async function fetchTier() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("user_profiles")
          .select("tier")
          .eq("id", userId)
          .single();

        if (!cancelled && !error && data?.tier) {
          setTier(data.tier as UserTier);
        } else if (!cancelled) {
          setTier("free");
        }
      } catch {
        if (!cancelled) setTier("free");
      }
    }

    fetchTier();

    return () => {
      cancelled = true;
    };
  }, [userId, isGuest]);

  const value: UserTierState = isGuest
    ? { tier: "guest", isProUser: false, isAuthenticated: false }
    : { tier, isProUser: tier === "pro", isAuthenticated: true };

  return (
    <UserTierContext.Provider value={value}>
      {children}
    </UserTierContext.Provider>
  );
}

export function useUserTier(): UserTierState {
  const context = useContext(UserTierContext);
  if (!context) {
    throw new Error("useUserTier must be used within a UserTierProvider");
  }
  return context;
}
