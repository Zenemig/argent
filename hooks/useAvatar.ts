"use client";

import { useState, useEffect } from "react";
import { getLocalAvatar } from "@/lib/avatar";

/**
 * Loads the local avatar blob from IndexedDB and returns an object URL.
 * Returns null when no avatar is stored. Cleans up the URL on unmount.
 */
export function useAvatar(): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    getLocalAvatar().then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setAvatarUrl(url);
      }
    });

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  return avatarUrl;
}
