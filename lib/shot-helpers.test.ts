import { describe, it, expect } from "vitest";
import {
  getAutoFillDefaults,
  shouldWarnExceedFrameCount,
  canLogFrame,
  computeNextFrameNumber,
  createBlankFrame,
  validateSkipTo,
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

describe("computeNextFrameNumber", () => {
  it("returns 1 for empty array", () => {
    expect(computeNextFrameNumber([])).toBe(1);
  });

  it("returns 2 when one frame exists", () => {
    const frames = [makeFrame({ frame_number: 1 })];
    expect(computeNextFrameNumber(frames)).toBe(2);
  });

  it("returns max + 1 for sequential frames", () => {
    const frames = [
      makeFrame({ frame_number: 1 }),
      makeFrame({ frame_number: 2 }),
      makeFrame({ frame_number: 3 }),
    ];
    expect(computeNextFrameNumber(frames)).toBe(4);
  });

  it("returns max + 1 when there are gaps (skipped frames)", () => {
    const frames = [
      makeFrame({ frame_number: 1 }),
      makeFrame({ frame_number: 2 }),
      makeFrame({ frame_number: 5 }),
      makeFrame({ frame_number: 6 }),
    ];
    expect(computeNextFrameNumber(frames)).toBe(7);
  });

  it("handles non-sequential frame numbers", () => {
    const frames = [
      makeFrame({ frame_number: 3 }),
      makeFrame({ frame_number: 1 }),
    ];
    expect(computeNextFrameNumber(frames)).toBe(4);
  });
});

describe("createBlankFrame", () => {
  it("returns object with is_blank: true", () => {
    const blank = createBlankFrame("01TESTROLL000000000000000", 5);
    expect(blank.is_blank).toBe(true);
  });

  it("has null shutter_speed and aperture", () => {
    const blank = createBlankFrame("01TESTROLL000000000000000", 5);
    expect(blank.shutter_speed).toBeNull();
    expect(blank.aperture).toBeNull();
  });

  it("has correct roll_id and frame_number", () => {
    const blank = createBlankFrame("01TESTROLL000000000000000", 3);
    expect(blank.roll_id).toBe("01TESTROLL000000000000000");
    expect(blank.frame_number).toBe(3);
  });

  it("has all optional fields as null", () => {
    const blank = createBlankFrame("01TESTROLL000000000000000", 1);
    expect(blank.lens_id).toBeNull();
    expect(blank.metering_mode).toBeNull();
    expect(blank.exposure_comp).toBeNull();
    expect(blank.filter).toBeNull();
    expect(blank.focal_length).toBeNull();
    expect(blank.latitude).toBeNull();
    expect(blank.longitude).toBeNull();
    expect(blank.location_name).toBeNull();
    expect(blank.notes).toBeNull();
    expect(blank.thumbnail).toBeNull();
    expect(blank.image_url).toBeNull();
  });

  it("has valid timestamps", () => {
    const before = Date.now();
    const blank = createBlankFrame("01TESTROLL000000000000000", 1);
    const after = Date.now();
    expect(blank.captured_at).toBeGreaterThanOrEqual(before);
    expect(blank.captured_at).toBeLessThanOrEqual(after);
    expect(blank.updated_at).toBeGreaterThanOrEqual(before);
    expect(blank.created_at).toBeGreaterThanOrEqual(before);
    expect(blank.deleted_at).toBeNull();
  });
});

describe("validateSkipTo", () => {
  it("returns valid for target > current", () => {
    expect(validateSkipTo(5, 3, 36)).toEqual({ valid: true });
  });

  it("returns invalid for target equal to current", () => {
    const result = validateSkipTo(3, 3, 36);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("skipToMustBeGreater");
  });

  it("returns invalid for target less than current", () => {
    const result = validateSkipTo(2, 3, 36);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("skipToMustBeGreater");
  });

  it("returns invalid for non-integer target", () => {
    const result = validateSkipTo(3.5, 2, 36);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalidFrameNumber");
  });

  it("returns invalid for target < 1", () => {
    const result = validateSkipTo(0, 1, 36);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalidFrameNumber");
  });

  it("returns invalid when exceeding max cap", () => {
    // max(36 * 2, 100) = 100
    const result = validateSkipTo(101, 1, 36);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("skipToExceedsMax");
  });

  it("returns valid at the max boundary", () => {
    // max(36 * 2, 100) = 100
    expect(validateSkipTo(100, 1, 36)).toEqual({ valid: true });
  });

  it("uses frameCount * 2 when larger than 100", () => {
    // max(72 * 2, 100) = 144
    expect(validateSkipTo(144, 1, 72)).toEqual({ valid: true });
    const result = validateSkipTo(145, 1, 72);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("skipToExceedsMax");
  });
});
