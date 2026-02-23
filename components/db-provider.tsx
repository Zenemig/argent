"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createArgentDb, type ArgentDb } from "@/lib/db";
import { seedFilmStocks } from "@/lib/seed";
import { migrateFromLegacyDb } from "@/lib/db-migration";

// ---- DbContext ---------------------------------------------------------------

const DbContext = createContext<ArgentDb | null>(null);

/**
 * Returns the current per-user ArgentDb instance from context.
 * Throws if used outside a <DbProvider> tree.
 */
export function useDb(): ArgentDb {
  const db = useContext(DbContext);
  if (!db) {
    throw new Error(
      "useDb() must be called inside a <DbProvider>. " +
        "Ensure your component is rendered within the (app) layout.",
    );
  }
  return db;
}

// ---- StorageContext ----------------------------------------------------------

interface StorageContextValue {
  isPersisted: boolean | null;
}

const StorageContext = createContext<StorageContextValue>({
  isPersisted: null,
});

export function useStoragePersisted(): boolean | null {
  return useContext(StorageContext).isPersisted;
}

// ---- DbProvider -------------------------------------------------------------

interface DbProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function DbProvider({ userId, children }: DbProviderProps) {
  const [db, setDb] = useState<ArgentDb | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const currentDbRef = useRef<ArgentDb | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Close previous db instance if userId changed
      if (currentDbRef.current) {
        currentDbRef.current.close();
        currentDbRef.current = null;
      }

      const newDb = createArgentDb(userId);
      currentDbRef.current = newDb;

      // Migration from legacy shared "argent" database
      try {
        await migrateFromLegacyDb(userId, newDb);
      } catch (err) {
        console.warn("[Argent] Migration error:", err);
      }

      if (cancelled) {
        newDb.close();
        currentDbRef.current = null;
        return;
      }

      // Seed film stocks (idempotent via sentinel key)
      const seeded = await newDb._syncMeta.get("seeded");
      if (!seeded) {
        await seedFilmStocks(newDb.filmStock);
        await newDb._syncMeta.put({ key: "seeded", value: "true" });
      }

      if (cancelled) {
        newDb.close();
        currentDbRef.current = null;
        return;
      }

      // Request storage persistence (iOS PWA requirement)
      if (navigator.storage?.persist) {
        try {
          const granted = await navigator.storage.persist();
          if (!cancelled) setIsPersisted(granted);
        } catch {
          if (!cancelled) setIsPersisted(false);
        }
      }

      if (!cancelled) setDb(newDb);
    }

    setDb(null); // Show loading state while switching users
    init();

    return () => {
      cancelled = true;
      if (currentDbRef.current) {
        currentDbRef.current.close();
        currentDbRef.current = null;
      }
    };
  }, [userId]);

  if (!db) return null;

  return (
    <DbContext value={db}>
      <StorageContext value={{ isPersisted }}>
        {children}
      </StorageContext>
    </DbContext>
  );
}
