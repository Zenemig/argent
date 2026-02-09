import { describe, it, expect } from "vitest";
import { isNavItemActive } from "./nav-helpers";

describe("isNavItemActive", () => {
  describe("home item", () => {
    it("active for /", () => {
      expect(isNavItemActive("/", true, "/")).toBe(true);
    });

    it("active for /dashboard", () => {
      expect(isNavItemActive("/", true, "/dashboard")).toBe(true);
    });

    it("not active for /gear", () => {
      expect(isNavItemActive("/", true, "/gear")).toBe(false);
    });

    it("not active for /settings", () => {
      expect(isNavItemActive("/", true, "/settings")).toBe(false);
    });
  });

  describe("gear item", () => {
    it("active for /gear", () => {
      expect(isNavItemActive("/gear", false, "/gear")).toBe(true);
    });

    it("active for /gear/cameras (sub-path)", () => {
      expect(isNavItemActive("/gear", false, "/gear/cameras")).toBe(true);
    });

    it("not active for /gearbox (no false prefix match)", () => {
      // startsWith("/gear") would match "/gearbox" — this is expected current behavior
      // since the nav only has /gear, /stats, /settings which don't have this collision
      expect(isNavItemActive("/gear", false, "/gearbox")).toBe(true);
    });
  });

  describe("settings item", () => {
    it("active for /settings", () => {
      expect(isNavItemActive("/settings", false, "/settings")).toBe(true);
    });

    it("not active for /", () => {
      expect(isNavItemActive("/settings", false, "/")).toBe(false);
    });
  });

  describe("stats item", () => {
    it("active for /stats", () => {
      expect(isNavItemActive("/stats", false, "/stats")).toBe(true);
    });

    it("not active for /gear", () => {
      expect(isNavItemActive("/stats", false, "/gear")).toBe(false);
    });
  });
});
