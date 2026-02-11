import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

let mockUserId: string | null | undefined = "user-123";
vi.mock("@/hooks/useUserId", () => ({
  useUserId: () => mockUserId,
}));

let queryCallIndex = 0;
const mockQueryResults: unknown[] = [];
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => {
    const result = mockQueryResults[queryCallIndex];
    queryCallIndex++;
    return result;
  },
}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("ulid", () => ({
  ulid: () => "test-lens-ulid",
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/constants", () => ({
  LENS_MOUNTS: ["F-mount", "M42"],
  formatLabel: (v: string) => v,
}));

vi.mock("./lens-form", () => ({
  LensForm: () => <div data-testid="lens-form" />,
}));

vi.mock("@/lib/lens-utils", () => ({
  formatLensSpec: (lens: { focal_length: number; max_aperture: number; focal_length_max?: number | null; min_aperture?: number | null }) => {
    const fl = lens.focal_length_max
      ? `${lens.focal_length}-${lens.focal_length_max}mm`
      : `${lens.focal_length}mm`;
    const ap = lens.min_aperture
      ? `f/${lens.max_aperture}-${lens.min_aperture}`
      : `f/${lens.max_aperture}`;
    return `${fl} ${ap}`;
  },
}));

import { LensCatalog } from "./lens-catalog";

describe("LensCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders skeleton when data is loading", () => {
    mockUserId = undefined;
    mockQueryResults.push(undefined, undefined, undefined);
    const { container } = render(<LensCatalog />);
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no lenses", () => {
    // lenses, cameras, lensStocks
    mockQueryResults.push([], [], []);
    render(<LensCatalog />);
    expect(screen.getByText("emptyLens")).toBeDefined();
  });

  it("renders lens cards when lenses exist", () => {
    const lenses = [
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        camera_id: null,
      },
    ];
    mockQueryResults.push(lenses, [], []);
    render(<LensCatalog />);
    expect(screen.getByText("Nikkor 50mm f/1.4")).toBeDefined();
  });

  it("renders your lenses heading", () => {
    mockQueryResults.push([], [], []);
    render(<LensCatalog />);
    expect(screen.getByText("yourLenses")).toBeDefined();
  });

  it("renders add custom lens button", () => {
    mockQueryResults.push([], [], []);
    render(<LensCatalog />);
    expect(screen.getByText("addCustomLens")).toBeDefined();
  });

  it("renders lens catalog section", () => {
    mockQueryResults.push([], [], []);
    render(<LensCatalog />);
    expect(screen.getByText("lensCatalog")).toBeDefined();
    expect(screen.getByText("addFromCatalog")).toBeDefined();
  });

  it("shows universal badge for lenses without linked camera", () => {
    const lenses = [
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        camera_id: null,
      },
    ];
    mockQueryResults.push(lenses, [], []);
    render(<LensCatalog />);
    expect(screen.getByText("universal")).toBeDefined();
  });

  it("shows camera name for linked lens", () => {
    const lenses = [
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        camera_id: "cam-1",
      },
    ];
    const cameras = [
      {
        id: "cam-1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
      },
    ];
    mockQueryResults.push(lenses, cameras, []);
    render(<LensCatalog />);
    expect(screen.getByText("Nikon FM2")).toBeDefined();
  });

  it("renders edit and delete buttons for each lens", () => {
    const lenses = [
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        camera_id: null,
      },
    ];
    mockQueryResults.push(lenses, [], []);
    render(<LensCatalog />);
    expect(screen.getByLabelText("edit")).toBeDefined();
    expect(screen.getByLabelText("delete")).toBeDefined();
  });

  it("displays zoom lens spec with range", () => {
    const lenses = [
      {
        id: "lens-z",
        name: "Nikkor 24-70mm f/2.8",
        make: "Nikon",
        focal_length: 24,
        max_aperture: 2.8,
        focal_length_max: 70,
        min_aperture: null,
        camera_id: null,
      },
    ];
    mockQueryResults.push(lenses, [], []);
    render(<LensCatalog />);
    // The spec line uses formatLensSpec: "Nikon · 24-70mm f/2.8"
    expect(screen.getByText(/Nikon · 24-70mm f\/2\.8/)).toBeDefined();
  });

  it("displays prime lens spec without range", () => {
    const lenses = [
      {
        id: "lens-1",
        name: "Nikkor 50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        camera_id: null,
      },
    ];
    mockQueryResults.push(lenses, [], []);
    render(<LensCatalog />);
    // The spec line uses formatLensSpec, producing "Nikon · 50mm f/1.4"
    expect(screen.getByText(/Nikon · 50mm f\/1\.4/)).toBeDefined();
  });
});
