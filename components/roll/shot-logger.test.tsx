import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
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

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/image-sync", () => ({
  toBlob: () => null,
}));

vi.mock("@/lib/lens-utils", () => ({
  isZoomLens: (lens: { focal_length_max?: number | null }) => lens.focal_length_max != null,
  formatFocalLength: (lens: { focal_length: number; focal_length_max?: number | null }) =>
    lens.focal_length_max ? `${lens.focal_length}-${lens.focal_length_max}mm` : `${lens.focal_length}mm`,
  defaultFrameFocalLength: (lens: { focal_length: number; focal_length_max?: number | null }) =>
    lens.focal_length_max ? Math.round((lens.focal_length + lens.focal_length_max) / 2) : lens.focal_length,
}));

vi.mock("ulid", () => ({
  ulid: () => "test-ulid-001",
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
  ScrollBar: () => null,
}));

import { ShotLogger } from "./shot-logger";
import type { Roll } from "@/lib/types";

function makeRoll(overrides: Partial<Roll> = {}): Roll {
  return {
    id: "roll-001",
    user_id: "user-1",
    camera_id: "cam-1",
    film_id: "film-1",
    lens_id: null,
    status: "active",
    frame_count: 36,
    ei: 400,
    push_pull: 0,
    lab_name: null,
    dev_notes: null,
    notes: null,
    start_date: Date.now(),
    finish_date: null,
    develop_date: null,
    scan_date: null,
    deleted_at: null,
    updated_at: Date.now(),
    created_at: Date.now(),
    ...overrides,
  } as Roll;
}

describe("ShotLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
  });

  it("renders frame counter for active roll", () => {
    // frames, lenses
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("frameNumber:{\"number\":1}")).toBeDefined();
  });

  it("renders save button for active roll", () => {
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("renders save button for loaded roll", () => {
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll({ status: "loaded" })} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("does not render log controls for finished roll", () => {
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll({ status: "finished" })} />);
    expect(screen.queryByText("save")).toBeNull();
  });

  it("renders existing frames in timeline", () => {
    const frames = [
      {
        id: "f1",
        roll_id: "roll-001",
        frame_number: 1,
        shutter_speed: "1/125",
        aperture: 5.6,
        lens_id: null,
        notes: null,
        latitude: null,
        thumbnail: null,
      },
      {
        id: "f2",
        roll_id: "roll-001",
        frame_number: 2,
        shutter_speed: "1/250",
        aperture: 8,
        lens_id: null,
        notes: "Test note",
        latitude: null,
        thumbnail: null,
      },
    ];
    // Push extra copies: useEffect triggers re-renders (setState from last frame)
    // so useLiveQuery is called multiple times
    mockQueryResults.push(frames, [], frames, [], frames, []);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("#1")).toBeDefined();
    expect(screen.getByText("#2")).toBeDefined();
    expect(screen.getByText("1/125")).toBeDefined();
    expect(screen.getByText("Test note")).toBeDefined();
  });

  it("renders shutter speed and aperture selects", () => {
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("shutterSpeed")).toBeDefined();
    expect(screen.getByText("aperture")).toBeDefined();
  });

  it("renders note and filter inputs", () => {
    mockQueryResults.push([], []);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByPlaceholderText("note")).toBeDefined();
    expect(screen.getByPlaceholderText("filterUsed")).toBeDefined();
  });

  it("shows focal length input when zoom lens is selected", () => {
    const lenses = [
      {
        id: "lens-z",
        focal_length: 24,
        max_aperture: 2.8,
        focal_length_max: 70,
        min_aperture: null,
        camera_id: null,
        deleted_at: null,
      },
    ];
    // frames, lenses — push extra for re-renders
    mockQueryResults.push([], lenses, [], lenses);
    render(<ShotLogger roll={makeRoll({ lens_id: "lens-z" })} />);
    expect(screen.getByLabelText("focalLengthUsed")).toBeDefined();
  });

  it("does not show focal length input for prime lens", () => {
    const lenses = [
      {
        id: "lens-p",
        focal_length: 50,
        max_aperture: 1.4,
        focal_length_max: null,
        min_aperture: null,
        camera_id: null,
        deleted_at: null,
      },
    ];
    mockQueryResults.push([], lenses, [], lenses);
    render(<ShotLogger roll={makeRoll({ lens_id: "lens-p" })} />);
    expect(screen.queryByLabelText("focalLengthUsed")).toBeNull();
  });

});
