"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { seedFilmStocks } from "@/lib/seed";

interface StorageContextValue {
  isPersisted: boolean | null;
}

const StorageContext = createContext<StorageContextValue>({
  isPersisted: null,
});

export function useStoragePersisted(): boolean | null {
  return useContext(StorageContext).isPersisted;
}

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      const seeded = await db._syncMeta.get("seeded");
      if (!seeded) {
        await seedFilmStocks(db.filmStock);
        await db._syncMeta.put({ key: "seeded", value: "true" });
      }

      if (navigator.storage?.persist) {
        try {
          const granted = await navigator.storage.persist();
          setIsPersisted(granted);
        } catch {
          setIsPersisted(false);
        }
      }

      setReady(true);
    }
    init();
  }, []);

  if (!ready) return null;
  return (
    <StorageContext value={{ isPersisted }}>
      {children}
    </StorageContext>
  );
}
