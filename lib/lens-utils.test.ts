import { describe, it, expect } from "vitest";
import {
  isZoomLens,
  formatFocalLength,
  formatAperture,
  formatLensSpec,
  defaultFrameFocalLength,
} from "./lens-utils";

const primeLens = {
  focal_length: 50,
  max_aperture: 1.4,
  focal_length_max: null as number | null | undefined,
  min_aperture: null as number | null | undefined,
};

const constantZoom = {
  focal_length: 24,
  max_aperture: 2.8,
  focal_length_max: 70 as number | null | undefined,
  min_aperture: null as number | null | undefined,
};

const variableZoom = {
  focal_length: 35,
  max_aperture: 3.5,
  focal_length_max: 135 as number | null | undefined,
  min_aperture: 4.5 as number | null | undefined,
};

describe("isZoomLens", () => {
  it("returns false for prime lens", () => {
    expect(isZoomLens(primeLens)).toBe(false);
  });

  it("returns true for zoom lens", () => {
    expect(isZoomLens(constantZoom)).toBe(true);
  });

  it("returns false when focal_length_max is undefined", () => {
    expect(isZoomLens({ ...primeLens, focal_length_max: undefined })).toBe(false);
  });
});

describe("formatFocalLength", () => {
  it("formats prime lens", () => {
    expect(formatFocalLength(primeLens)).toBe("50mm");
  });

  it("formats zoom lens with range", () => {
    expect(formatFocalLength(constantZoom)).toBe("24-70mm");
  });

  it("formats variable aperture zoom lens", () => {
    expect(formatFocalLength(variableZoom)).toBe("35-135mm");
  });
});

describe("formatAperture", () => {
  it("formats prime lens aperture", () => {
    expect(formatAperture(primeLens)).toBe("f/1.4");
  });

  it("formats constant aperture zoom", () => {
    expect(formatAperture(constantZoom)).toBe("f/2.8");
  });

  it("formats variable aperture zoom", () => {
    expect(formatAperture(variableZoom)).toBe("f/3.5-4.5");
  });
});

describe("formatLensSpec", () => {
  it("formats prime lens spec", () => {
    expect(formatLensSpec(primeLens)).toBe("50mm f/1.4");
  });

  it("formats constant aperture zoom spec", () => {
    expect(formatLensSpec(constantZoom)).toBe("24-70mm f/2.8");
  });

  it("formats variable aperture zoom spec", () => {
    expect(formatLensSpec(variableZoom)).toBe("35-135mm f/3.5-4.5");
  });
});

describe("defaultFrameFocalLength", () => {
  it("returns focal_length for prime lens", () => {
    expect(defaultFrameFocalLength(primeLens)).toBe(50);
  });

  it("returns middle of range for zoom lens", () => {
    // (24 + 70) / 2 = 47, rounded
    expect(defaultFrameFocalLength(constantZoom)).toBe(47);
  });

  it("returns middle of range for variable zoom", () => {
    // (35 + 135) / 2 = 85
    expect(defaultFrameFocalLength(variableZoom)).toBe(85);
  });
});
