"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { seedFilmStocks } from "@/lib/seed";
import { seedCameraStocks } from "@/lib/seed-cameras";
import { seedLensStocks } from "@/lib/seed-lenses";

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const seeded = await db._syncMeta.get("seeded");
      if (!seeded) {
        await seedFilmStocks(db.filmStock);
        await db._syncMeta.put({ key: "seeded", value: "true" });
      }

      const seededCameras = await db._syncMeta.get("seeded_cameras");
      if (!seededCameras) {
        await seedCameraStocks(db.cameraStock);
        await db._syncMeta.put({ key: "seeded_cameras", value: "true" });
      }

      const seededLenses = await db._syncMeta.get("seeded_lenses");
      if (!seededLenses) {
        await seedLensStocks(db.lensStock);
        await db._syncMeta.put({ key: "seeded_lenses", value: "true" });
      }

      if (navigator.storage?.persist) {
        navigator.storage.persist().catch(() => {});
      }

      setReady(true);
    }
    init();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
