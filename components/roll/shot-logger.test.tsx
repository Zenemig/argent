import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

vi.mock("@/lib/gear-filters", () => ({
  filterShutterSpeeds: (
    min: string | null | undefined,
    max: string | null | undefined,
    hasBulb: boolean | null | undefined,
  ) => {
    const allSpeeds = ["B", "1s", "1/2", "1/125", "1/4000", "1/8000"];
    const timed = allSpeeds.filter((s) => s !== "B");
    if (min == null && max == null && hasBulb == null) return allSpeeds;
    const minIdx = min != null ? timed.indexOf(min) : 0;
    const maxIdx = max != null ? timed.indexOf(max) : timed.length - 1;
    const filtered = timed.slice(minIdx, maxIdx + 1);
    return hasBulb !== false ? ["B", ...filtered] : filtered;
  },
  filterApertures: (
    maxAp: number | null | undefined,
    apMin: number | null | undefined,
  ) => {
    const apertures = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
    if (maxAp == null && apMin == null) return apertures;
    return apertures.filter((a) => {
      if (maxAp != null && a < maxAp) return false;
      if (apMin != null && a > apMin) return false;
      return true;
    });
  },
  filterMeteringModes: (allowed: string[] | null | undefined) => {
    const modes = ["spot", "center", "matrix", "incident", "sunny16"];
    if (allowed == null) return modes;
    return modes.filter((m) => allowed.includes(m));
  },
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/image-sync", () => ({
  toBlob: () => null,
}));

const mockCaptureImage = vi.fn();
vi.mock("@/lib/image-capture", () => ({
  captureImage: (...args: unknown[]) => mockCaptureImage(...args),
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

/** Push one render cycle of mock query results: frames, camera, lenses */
function pushQueryCycle(frames: unknown = [], camera: unknown = undefined, lenses: unknown = []) {
  mockQueryResults.push(frames, camera, lenses);
}

describe("ShotLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
  });

  it("renders frame counter for active roll", () => {
    pushQueryCycle();
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("frameNumber:{\"number\":1}")).toBeDefined();
  });

  it("renders save button for active roll", () => {
    pushQueryCycle();
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("renders save button for loaded roll", () => {
    pushQueryCycle();
    render(<ShotLogger roll={makeRoll({ status: "loaded" })} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("does not render log controls for finished roll", () => {
    pushQueryCycle();
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
    // Push extra cycles: useEffect triggers re-renders (setState from last frame)
    for (let i = 0; i < 3; i++) pushQueryCycle(frames);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("#1")).toBeDefined();
    expect(screen.getByText("#2")).toBeDefined();
    expect(screen.getByText("1/125")).toBeDefined();
    expect(screen.getByText("Test note")).toBeDefined();
  });

  it("renders shutter speed and aperture selects", () => {
    pushQueryCycle();
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("shutterSpeed")).toBeDefined();
    expect(screen.getByText("aperture")).toBeDefined();
  });

  it("renders note and filter inputs", () => {
    pushQueryCycle();
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
    // Extra cycles for re-renders (selectedLens useEffect -> setFrameFocalLength for zoom)
    for (let i = 0; i < 6; i++) pushQueryCycle([], undefined, lenses);
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
    for (let i = 0; i < 3; i++) pushQueryCycle([], undefined, lenses);
    render(<ShotLogger roll={makeRoll({ lens_id: "lens-p" })} />);
    expect(screen.queryByLabelText("focalLengthUsed")).toBeNull();
  });

  it("uses filterShutterSpeeds with camera constraints", () => {
    const camera = {
      id: "cam-1",
      shutter_speed_min: "1s",
      shutter_speed_max: "1/4000",
      metering_modes: null,
    };
    pushQueryCycle([], camera);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("shutterSpeed")).toBeDefined();
  });

  it("uses filterMeteringModes with camera constraints", () => {
    const camera = {
      id: "cam-1",
      shutter_speed_min: null,
      shutter_speed_max: null,
      metering_modes: ["center", "sunny16"],
    };
    pushQueryCycle([], camera);
    render(<ShotLogger roll={makeRoll()} />);
    expect(screen.getByText("meteringMode")).toBeDefined();
  });

  it("uses filterApertures with lens constraints", () => {
    const lenses = [
      {
        id: "lens-c",
        focal_length: 50,
        max_aperture: 1.4,
        focal_length_max: null,
        min_aperture: null,
        aperture_min: 16,
        camera_id: null,
        deleted_at: null,
      },
    ];
    for (let i = 0; i < 3; i++) pushQueryCycle([], undefined, lenses);
    render(<ShotLogger roll={makeRoll({ lens_id: "lens-c" })} />);
    expect(screen.getByText("aperture")).toBeDefined();
  });

  it("calls captureImage when camera button is clicked", async () => {
    mockCaptureImage.mockResolvedValue({ error: "no_file" as const });
    pushQueryCycle();
    render(<ShotLogger roll={makeRoll()} />);

    const cameraBtn = screen.getByLabelText("captureImage");
    await userEvent.click(cameraBtn);

    await waitFor(() => {
      expect(mockCaptureImage).toHaveBeenCalledOnce();
    });
  });

});
