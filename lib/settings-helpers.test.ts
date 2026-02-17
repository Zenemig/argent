import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";

// We test getSetting/setSetting by directly using a fresh ArgentDb instance
// instead of importing from settings-helpers (which uses the singleton).
// This avoids cross-test contamination.

let db: ArgentDb;

beforeEach(async () => {
  db = new ArgentDb();
  await db.delete();
  db = new ArgentDb();
});

describe("getSetting / setSetting (via _syncMeta)", () => {
  it("returns null for missing key", async () => {
    const row = await db._syncMeta.get("nonexistent");
    expect(row?.value ?? null).toBeNull();
  });

  it("stores and retrieves a value", async () => {
    await db._syncMeta.put({ key: "theme", value: "dark" });
    const row = await db._syncMeta.get("theme");
    expect(row?.value).toBe("dark");
  });

  it("overwrites existing value", async () => {
    await db._syncMeta.put({ key: "theme", value: "dark" });
    await db._syncMeta.put({ key: "theme", value: "light" });
    const row = await db._syncMeta.get("theme");
    expect(row?.value).toBe("light");
  });

  it("supports multiple independent keys", async () => {
    await db._syncMeta.put({ key: "theme", value: "dark" });
    await db._syncMeta.put({ key: "displayName", value: "Alice" });
    expect((await db._syncMeta.get("theme"))?.value).toBe("dark");
    expect((await db._syncMeta.get("displayName"))?.value).toBe("Alice");
  });

  it("handles empty string values", async () => {
    await db._syncMeta.put({ key: "copyright", value: "" });
    const row = await db._syncMeta.get("copyright");
    expect(row?.value).toBe("");
  });
});

