import { describe, it, expect } from "vitest";
import {
  normalizeBrand,
  normalizeFormat,
  parseFormats,
  normalizeProcess,
  normalizeMount,
  makeId,
  findCol,
  matchKey,
  fuzzyNameMatch,
  inferMountFormat,
} from "./normalize.js";

describe("normalizeBrand", () => {
  it("maps known brand aliases", () => {
    expect(normalizeBrand("Eastman Kodak")).toBe("Kodak");
    expect(normalizeBrand("Kodak Alaris")).toBe("Kodak");
    expect(normalizeBrand("Fuji")).toBe("Fujifilm");
    expect(normalizeBrand("FUJIFILM")).toBe("Fujifilm");
    expect(normalizeBrand("Ilford Photo")).toBe("Ilford");
    expect(normalizeBrand("NIKON CORPORATION")).toBe("Nikon");
  });

  it("returns unknown brands as-is", () => {
    expect(normalizeBrand("CineStill")).toBe("CineStill");
    expect(normalizeBrand("Lomography")).toBe("Lomography");
  });

  it("trims whitespace", () => {
    expect(normalizeBrand("  Fuji  ")).toBe("Fujifilm");
  });
});

describe("normalizeFormat", () => {
  it("maps 135 variants to 35mm", () => {
    expect(normalizeFormat("135")).toBe("35mm");
    expect(normalizeFormat("35 mm")).toBe("35mm");
    expect(normalizeFormat("135-24")).toBe("35mm");
    expect(normalizeFormat("135-36")).toBe("35mm");
  });

  it("maps 120/220/620 variants to 120", () => {
    expect(normalizeFormat("120 film")).toBe("120");
    expect(normalizeFormat("220")).toBe("120");
    expect(normalizeFormat("620")).toBe("120");
  });

  it("maps large format variants", () => {
    expect(normalizeFormat("4×5")).toBe("4x5");
    expect(normalizeFormat("4x5\"")).toBe("4x5");
    expect(normalizeFormat("4x5 (25 Sheets)")).toBe("4x5");
    expect(normalizeFormat("5×4")).toBe("4x5");
    expect(normalizeFormat("8×10")).toBe("8x10");
    expect(normalizeFormat("8x10\"")).toBe("8x10");
  });

  it("maps sheet film to 4x5", () => {
    expect(normalizeFormat("Sheet film")).toBe("4x5");
    expect(normalizeFormat("sheet")).toBe("4x5");
  });

  it("maps niche formats to other", () => {
    expect(normalizeFormat("110")).toBe("other");
    expect(normalizeFormat("APS")).toBe("other");
    expect(normalizeFormat("16mm (Movie Film)")).toBe("other");
    expect(normalizeFormat("5x7\"")).toBe("other");
    expect(normalizeFormat("100 ft")).toBe("other");
  });

  it("maps pure exposure counts to empty string", () => {
    expect(normalizeFormat("24")).toBe("");
    expect(normalizeFormat("36")).toBe("");
  });

  it("strips Wikipedia reference markers", () => {
    expect(normalizeFormat("[68] 120")).toBe("120");
  });

  it("maps unknown formats to other", () => {
    expect(normalizeFormat("SUC-27")).toBe("other");
  });
});

describe("parseFormats", () => {
  it("splits on comma", () => {
    expect(parseFormats("135, 120")).toEqual(["35mm", "120"]);
  });

  it("splits on slash", () => {
    expect(parseFormats("135/120")).toEqual(["35mm", "120"]);
  });

  it("deduplicates", () => {
    expect(parseFormats("135, 35mm")).toEqual(["35mm"]);
  });

  it("filters empty entries from exposure counts", () => {
    const result = parseFormats("135, 120, 24, 36");
    expect(result).toEqual(["35mm", "120"]);
  });

  it("defaults to 35mm in transformer when empty", () => {
    // parseFormats itself returns empty, transformer handles default
    expect(parseFormats("")).toEqual([]);
  });
});

describe("normalizeProcess", () => {
  it("normalizes C-41 variants", () => {
    expect(normalizeProcess("C-41")).toBe("C-41");
    expect(normalizeProcess("C41")).toBe("C-41");
    expect(normalizeProcess("Color Negative")).toBe("C-41");
    expect(normalizeProcess("CN")).toBe("C-41");
  });

  it("normalizes E-6 variants", () => {
    expect(normalizeProcess("E-6")).toBe("E-6");
    expect(normalizeProcess("E6")).toBe("E-6");
    expect(normalizeProcess("Slide")).toBe("E-6");
    expect(normalizeProcess("Color Reversal")).toBe("E-6");
  });

  it("normalizes BW variants", () => {
    expect(normalizeProcess("B&W")).toBe("BW");
    expect(normalizeProcess("B+W")).toBe("BW");
    expect(normalizeProcess("B/W")).toBe("BW");
    expect(normalizeProcess("Black-and-white")).toBe("BW");
    expect(normalizeProcess("Monochrome")).toBe("BW");
  });

  it("detects chromogenic BW", () => {
    expect(normalizeProcess("B&W C-41")).toBe("BW-C41");
    expect(normalizeProcess("Chromogenic B&W")).toBe("BW-C41");
  });

  it("maps niche processes to other", () => {
    expect(normalizeProcess("ECN-2")).toBe("other");
    expect(normalizeProcess("K-14")).toBe("other");
    expect(normalizeProcess("instant")).toBe("other");
  });
});

describe("normalizeMount", () => {
  it("maps curated mounts through directly", () => {
    expect(normalizeMount("Nikon F")).toBe("Nikon F");
    expect(normalizeMount("Canon EF")).toBe("Canon EF");
    expect(normalizeMount("M42")).toBe("M42");
  });

  it("maps Lensfun mount names to curated values", () => {
    expect(normalizeMount("Nikon F AF")).toBe("Nikon F");
    expect(normalizeMount("Nikon F AI-S")).toBe("Nikon F");
    expect(normalizeMount("Canon EF-S")).toBe("Canon EF");
    expect(normalizeMount("Pentax KAF2")).toBe("Pentax K");
    expect(normalizeMount("Minolta MD")).toBe("Minolta MD/MC");
  });

  it("maps Wikipedia mount names", () => {
    expect(normalizeMount("Nikon F-mount")).toBe("Nikon F");
    expect(normalizeMount("M42 screw mount")).toBe("M42");
    expect(normalizeMount("Leica M-mount")).toBe("Leica M");
  });

  it("maps Pentax 645 variants", () => {
    expect(normalizeMount("Pentax 645AF")).toBe("Pentax 645");
    expect(normalizeMount("Pentax 645AF2")).toBe("Pentax 645");
  });

  it("maps unknown mounts to other", () => {
    expect(normalizeMount("Sony A-mount")).toBe("other");
    expect(normalizeMount("Generic")).toBe("other");
  });
});

describe("makeId", () => {
  it("creates kebab-case ID", () => {
    expect(makeId("Kodak", "Portra 400")).toBe("kodak-portra-400");
  });

  it("strips special characters", () => {
    expect(makeId("Fujifilm", "Superia X-TRA 400")).toBe("fujifilm-superia-x-tra-400");
  });

  it("handles leading/trailing hyphens", () => {
    expect(makeId("", "Test")).toBe("test");
  });
});

describe("findCol", () => {
  it("finds matching column", () => {
    expect(findCol(["make", "name", "iso"], ["make", "brand"])).toBe(0);
    expect(findCol(["make", "name", "iso"], ["name"])).toBe(1);
  });

  it("returns -1 when no match", () => {
    expect(findCol(["make", "name"], ["process"])).toBe(-1);
  });

  it("uses substring matching", () => {
    expect(findCol(["film name", "iso speed"], ["name"])).toBe(0);
  });
});

describe("matchKey", () => {
  it("creates normalized lookup key", () => {
    expect(matchKey("Kodak", "Portra 400")).toBe("kodak|portra400");
  });
});

describe("fuzzyNameMatch", () => {
  it("matches when one name contains the other", () => {
    expect(fuzzyNameMatch("Portra 400", "Portra")).toBe(true);
    expect(fuzzyNameMatch("HP5", "HP5 Plus")).toBe(true);
  });

  it("does not match unrelated names", () => {
    expect(fuzzyNameMatch("Portra 400", "Tri-X")).toBe(false);
  });
});

describe("inferMountFormat", () => {
  it("detects medium format mounts", () => {
    expect(inferMountFormat("Mamiya 645")).toBe("120");
    expect(inferMountFormat("Pentax 67")).toBe("120");
    expect(inferMountFormat("Hasselblad V")).toBe("120");
  });

  it("defaults to 35mm", () => {
    expect(inferMountFormat("Nikon F")).toBe("35mm");
    expect(inferMountFormat("Canon EF")).toBe("35mm");
  });
});
