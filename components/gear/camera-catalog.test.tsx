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
  ulid: () => "test-cam-ulid",
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/constants", () => ({
  FILM_FORMATS: ["35mm", "120", "4x5"],
  LENS_MOUNTS: ["F-mount", "M42"],
  CAMERA_TYPES: ["SLR", "Rangefinder"],
  formatLabel: (v: string) => v,
}));

vi.mock("./camera-form", () => ({
  CameraForm: () => <div data-testid="camera-form" />,
}));

import { CameraCatalog } from "./camera-catalog";

describe("CameraCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders skeleton when data is loading", () => {
    mockUserId = undefined;
    mockQueryResults.push(undefined, undefined);
    const { container } = render(<CameraCatalog />);
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no cameras", () => {
    // cameras, cameraStocks
    mockQueryResults.push([], []);
    render(<CameraCatalog />);
    expect(screen.getByText("emptyCamera")).toBeDefined();
  });

  it("renders camera cards when cameras exist", () => {
    const cameras = [
      {
        id: "cam-1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
      },
    ];
    mockQueryResults.push(cameras, []);
    render(<CameraCatalog />);
    expect(screen.getByText("Nikon FM2")).toBeDefined();
    expect(screen.getByText("Nikon")).toBeDefined();
    expect(screen.getByText("35mm")).toBeDefined();
  });

  it("renders your cameras heading", () => {
    mockQueryResults.push([], []);
    render(<CameraCatalog />);
    expect(screen.getByText("yourCameras")).toBeDefined();
  });

  it("renders add custom camera button", () => {
    mockQueryResults.push([], []);
    render(<CameraCatalog />);
    expect(screen.getByText("addCustomCamera")).toBeDefined();
  });

  it("renders camera catalog section", () => {
    mockQueryResults.push([], []);
    render(<CameraCatalog />);
    expect(screen.getByText("cameraCatalog")).toBeDefined();
    expect(screen.getByText("addFromCatalog")).toBeDefined();
  });

  it("renders edit and delete buttons for each camera", () => {
    const cameras = [
      {
        id: "cam-1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
      },
    ];
    mockQueryResults.push(cameras, []);
    render(<CameraCatalog />);
    expect(screen.getByLabelText("edit")).toBeDefined();
    expect(screen.getByLabelText("delete")).toBeDefined();
  });
});
