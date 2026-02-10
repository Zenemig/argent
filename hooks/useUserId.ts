"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GUEST_USER_ID } from "@/lib/guest";

/**
 * Returns the current Supabase user UUID, or GUEST_USER_ID if unauthenticated.
 * Subscribes to auth state changes so the value updates on sign-in/sign-out.
 */
export function useUserId(): string {
  const [userId, setUserId] = useState<string>(GUEST_USER_ID);

  useEffect(() => {
    const supabase = createClient();

    // Read initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? GUEST_USER_ID);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? GUEST_USER_ID);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
