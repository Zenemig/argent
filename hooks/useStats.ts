"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useUserId } from "./useUserId";
import {
  computeFilmUsage,
  computeShotsPerMonth,
  computeCameraUsage,
  computeFocalLengthUsage,
  computeAvgFramesPerRoll,
} from "@/lib/stats";

export function useStats() {
  const userId = useUserId();

  const rolls = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.rolls
        .where("user_id")
        .equals(userId!)
        .filter(
          (r) =>
            (r.deleted_at === null || r.deleted_at === undefined) &&
            r.status !== "discarded",
        )
        .toArray();
    },
    [userId],
  );

  const frames = useLiveQuery(async () => {
    if (!rolls || rolls.length === 0) return [];
    const rollIds = rolls.map((r) => r.id);
    const all = await db.frames.where("roll_id").anyOf(rollIds).toArray();
    return all.filter((f) => !f.is_blank && f.deleted_at == null);
  }, [rolls]);

  const cameras = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.cameras
        .where("user_id")
        .equals(userId!)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray();
    },
    [userId],
  );

  const lenses = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.lenses
        .where("user_id")
        .equals(userId!)
        .filter((l) => l.deleted_at === null || l.deleted_at === undefined)
        .toArray();
    },
    [userId],
  );

  const customFilms = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.films
        .where("user_id")
        .equals(userId!)
        .filter((f) => f.deleted_at === null || f.deleted_at === undefined)
        .toArray();
    },
    [userId],
  );

  const seedFilms = useLiveQuery(() => db.filmStock.toArray(), []);

  const isLoading =
    userId === undefined || !rolls || !frames || !cameras || !lenses || !customFilms || !seedFilms;

  const filmUsage = useMemo(() => {
    if (isLoading) return undefined;
    return computeFilmUsage(rolls, customFilms, seedFilms);
  }, [isLoading, rolls, customFilms, seedFilms]);

  const shotsPerMonth = useMemo(() => {
    if (isLoading) return undefined;
    return computeShotsPerMonth(frames);
  }, [isLoading, frames]);

  const cameraUsage = useMemo(() => {
    if (isLoading) return undefined;
    return computeCameraUsage(rolls, cameras);
  }, [isLoading, rolls, cameras]);

  const focalLengthUsage = useMemo(() => {
    if (isLoading) return undefined;
    return computeFocalLengthUsage(frames, lenses);
  }, [isLoading, frames, lenses]);

  const avgFramesPerRoll = useMemo(() => {
    if (isLoading) return undefined;
    const counts = new Map<string, number>();
    for (const frame of frames) {
      counts.set(frame.roll_id, (counts.get(frame.roll_id) ?? 0) + 1);
    }
    return computeAvgFramesPerRoll(rolls, counts);
  }, [isLoading, rolls, frames]);

  const hasData = !isLoading && rolls.length > 0;

  return {
    filmUsage,
    shotsPerMonth,
    cameraUsage,
    focalLengthUsage,
    avgFramesPerRoll,
    isLoading,
    hasData,
  };
}
