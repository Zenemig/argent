import { describe, it, expect } from "vitest";
import {
  getAutoFillDefaults,
  shouldWarnExceedFrameCount,
  canLogFrame,
} from "./shot-helpers";
import type { Frame, RollStatus } from "./types";

const makeFrame = (overrides?: Partial<Frame>): Frame => ({
  id: "01TESTFRAME00000000000000",
  roll_id: "01TESTROLL000000000000000",
  frame_number: 1,
  shutter_speed: "1/125",
  aperture: 5.6,
  lens_id: "01TESTLENS0000000000000000",
  metering_mode: "spot",
  exposure_comp: -0.5,
  filter: "Orange #21",
  latitude: 40.7128,
  longitude: -74.006,
  location_name: "New York",
  notes: "Test note",
  thumbnail: null,
  image_url: null,
  captured_at: Date.now(),
  updated_at: Date.now(),
  created_at: Date.now(),
  ...overrides,
});

describe("getAutoFillDefaults", () => {
  it("copies shutter_speed from last frame", () => {
    const frame = makeFrame({ shutter_speed: "1/250" });
    expect(getAutoFillDefaults(frame).shutter_speed).toBe("1/250");
  });

  it("copies aperture", () => {
    const frame = makeFrame({ aperture: 2.8 });
    expect(getAutoFillDefaults(frame).aperture).toBe(2.8);
  });

  it("copies lens_id", () => {
    const frame = makeFrame({ lens_id: "01LENS000000000000000000" });
    expect(getAutoFillDefaults(frame).lens_id).toBe("01LENS000000000000000000");
  });

  it("copies metering_mode", () => {
    const frame = makeFrame({ metering_mode: "center" });
    expect(getAutoFillDefaults(frame).metering_mode).toBe("center");
  });

  it("copies exposure_comp", () => {
    const frame = makeFrame({ exposure_comp: 1.5 });
    expect(getAutoFillDefaults(frame).exposure_comp).toBe(1.5);
  });

  it("copies filter", () => {
    const frame = makeFrame({ filter: "ND 3-stop" });
    expect(getAutoFillDefaults(frame).filter).toBe("ND 3-stop");
  });

  it("handles null lens_id", () => {
    const frame = makeFrame({ lens_id: null });
    expect(getAutoFillDefaults(frame).lens_id).toBeNull();
  });

  it("handles null metering_mode", () => {
    const frame = makeFrame({ metering_mode: null });
    expect(getAutoFillDefaults(frame).metering_mode).toBeNull();
  });

  it("handles null exposure_comp", () => {
    const frame = makeFrame({ exposure_comp: null });
    expect(getAutoFillDefaults(frame).exposure_comp).toBeNull();
  });

  it("handles null filter", () => {
    const frame = makeFrame({ filter: null });
    expect(getAutoFillDefaults(frame).filter).toBeNull();
  });

  it("does NOT include notes", () => {
    const frame = makeFrame({ notes: "should not appear" });
    const defaults = getAutoFillDefaults(frame);
    expect("notes" in defaults).toBe(false);
  });

  it("does NOT include frame_number or roll_id", () => {
    const defaults = getAutoFillDefaults(makeFrame());
    expect("frame_number" in defaults).toBe(false);
    expect("roll_id" in defaults).toBe(false);
  });
});

describe("shouldWarnExceedFrameCount", () => {
  it("returns false when frame is within count (frame 36 of 36)", () => {
    expect(shouldWarnExceedFrameCount(36, 36)).toBe(false);
  });

  it("returns true when frame exceeds count (frame 37 of 36)", () => {
    expect(shouldWarnExceedFrameCount(37, 36)).toBe(true);
  });

  it("returns false for frame 1 of any count", () => {
    expect(shouldWarnExceedFrameCount(1, 36)).toBe(false);
    expect(shouldWarnExceedFrameCount(1, 1)).toBe(false);
    expect(shouldWarnExceedFrameCount(1, 12)).toBe(false);
  });

  it("returns true for frame 2 of 1-frame roll", () => {
    expect(shouldWarnExceedFrameCount(2, 1)).toBe(true);
  });
});

describe("canLogFrame", () => {
  it("returns true for loaded", () => {
    expect(canLogFrame("loaded")).toBe(true);
  });

  it("returns true for active", () => {
    expect(canLogFrame("active")).toBe(true);
  });

  it("returns false for finished", () => {
    expect(canLogFrame("finished")).toBe(false);
  });

  it("returns false for developed", () => {
    expect(canLogFrame("developed")).toBe(false);
  });

  it("returns false for scanned", () => {
    expect(canLogFrame("scanned")).toBe(false);
  });

  it("returns false for archived", () => {
    expect(canLogFrame("archived")).toBe(false);
  });
});
