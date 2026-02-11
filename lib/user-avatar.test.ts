import { describe, it, expect } from "vitest";
import { getUserAvatar, type UserAvatar } from "./user-avatar";

describe("getUserAvatar", () => {
  it("returns an avatar with icon, bgColor, and iconColor", () => {
    const avatar = getUserAvatar("user-123");
    expect(avatar.icon).toBeDefined();
    expect(avatar.bgColor).toMatch(/^bg-\[#/);
    expect(avatar.iconColor).toMatch(/^text-\[#/);
  });

  it("returns a valid icon type", () => {
    const avatar = getUserAvatar("user-123");
    expect(["camera", "aperture", "film"]).toContain(avatar.icon);
  });

  it("is deterministic — same ID returns same avatar", () => {
    const a = getUserAvatar("user-abc");
    const b = getUserAvatar("user-abc");
    expect(a).toEqual(b);
  });

  it("returns different avatars for different user IDs", () => {
    // Use IDs that are known to produce different hashes
    const a = getUserAvatar("user-one");
    const b = getUserAvatar("user-two");
    const c = getUserAvatar("user-three");
    // With 3 icons × 8 palette entries = 24 combos, at least two of three IDs
    // will differ. Verify deterministic outputs rather than relying on probability.
    const avatars = [a, b, c];
    const keys = avatars.map((av) => `${av.icon}-${av.bgColor}`);
    const unique = new Set(keys);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("handles empty string", () => {
    const avatar = getUserAvatar("");
    expect(avatar.icon).toBeDefined();
    expect(avatar.bgColor).toBeDefined();
  });

  it("handles long user IDs", () => {
    const avatar = getUserAvatar("a".repeat(1000));
    expect(["camera", "aperture", "film"]).toContain(avatar.icon);
  });
});
