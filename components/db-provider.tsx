"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { seedFilmStocks } from "@/lib/seed";

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const seeded = await db._syncMeta.get("seeded");
      if (!seeded) {
        await seedFilmStocks(db.filmStock);
        await db._syncMeta.put({ key: "seeded", value: "true" });
      }
      setReady(true);
    }
    init();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
