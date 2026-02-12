import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

vi.mock("ulid", () => ({
  ulid: () => "test-camera-ulid",
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/constants", () => ({
  FILM_FORMATS: ["35mm", "120", "4x5"],
  DEFAULT_FRAME_COUNTS: { "35mm": 36, "120": 12, "4x5": 1 },
  LENS_MOUNTS: ["Nikon F", "M42"],
  CAMERA_TYPES: ["slr", "rangefinder"],
  SHUTTER_SPEEDS: ["B", "1s", "1/2", "1/125", "1/4000"],
  METERING_MODES: ["spot", "center", "matrix", "incident", "sunny16"],
  formatLabel: (v: string) => v,
}));

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    "aria-label"?: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      aria-label={ariaLabel}
    />
  ),
}));

import { CameraForm } from "./camera-form";

describe("CameraForm", () => {
  const onDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = "user-123";
  });

  it("renders form fields for new camera", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByLabelText("name")).toBeDefined();
    expect(screen.getByLabelText("make")).toBeDefined();
    expect(screen.getByLabelText("frameCount")).toBeDefined();
    expect(screen.getByLabelText("notes")).toBeDefined();
  });

  it("renders mount and type dropdowns", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByLabelText("mount")).toBeDefined();
    expect(screen.getByLabelText("cameraType")).toBeDefined();
  });

  it("shows add button for new camera", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByText("add")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("shows save button for editing existing camera", () => {
    const camera = {
      id: "cam-1",
      user_id: "user-123",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      mount: null,
      type: null,
      default_frame_count: 36,
      notes: "My camera",
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<CameraForm camera={camera} onDone={onDone} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("pre-fills fields when editing", () => {
    const camera = {
      id: "cam-1",
      user_id: "user-123",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      mount: null,
      type: null,
      default_frame_count: 36,
      notes: "My camera",
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<CameraForm camera={camera} onDone={onDone} />);
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe(
      "Nikon FM2",
    );
    expect((screen.getByLabelText("make") as HTMLInputElement).value).toBe(
      "Nikon",
    );
  });

  it("calls onDone when cancel is clicked", () => {
    render(<CameraForm onDone={onDone} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(onDone).toHaveBeenCalled();
  });

  it("does not submit when name is empty", () => {
    render(<CameraForm onDone={onDone} />);
    const makeInput = screen.getByLabelText("make");
    fireEvent.change(makeInput, { target: { value: "Nikon" } });
    fireEvent.submit(screen.getByText("add").closest("form")!);
    expect(mockSyncAdd).not.toHaveBeenCalled();
  });

  it("renders shutter speed constraint selects", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByLabelText("shutterSpeedMin")).toBeDefined();
    expect(screen.getByLabelText("shutterSpeedMax")).toBeDefined();
  });

  it("renders bulb checkbox", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByLabelText("hasBulb")).toBeDefined();
  });

  it("renders metering modes checkboxes", () => {
    render(<CameraForm onDone={onDone} />);
    expect(screen.getByLabelText("spot")).toBeDefined();
    expect(screen.getByLabelText("center")).toBeDefined();
    expect(screen.getByLabelText("sunny16")).toBeDefined();
  });

  it("pre-fills constraint fields when editing", () => {
    const camera = {
      id: "cam-1",
      user_id: "user-123",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      mount: null,
      type: null,
      shutter_speed_min: "1s" as const,
      shutter_speed_max: "1/4000" as const,
      metering_modes: ["center", "sunny16"] as ("center" | "sunny16")[],
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<CameraForm camera={camera} onDone={onDone} />);
    // Metering checkboxes should be checked
    const centerCheckbox = screen.getByLabelText("center") as HTMLInputElement;
    expect(centerCheckbox.checked).toBe(true);
    const spotCheckbox = screen.getByLabelText("spot") as HTMLInputElement;
    expect(spotCheckbox.checked).toBe(false);
  });
});
