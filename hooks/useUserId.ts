"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns the current Supabase user UUID, or null if unauthenticated.
 * Subscribes to auth state changes so the value updates on sign-in/sign-out.
 */
export function useUserId(): string | null | undefined {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // Read initial auth state
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) setUserId(user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
