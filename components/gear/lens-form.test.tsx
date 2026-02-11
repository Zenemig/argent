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
  ulid: () => "test-lens-ulid",
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

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

import { LensForm } from "./lens-form";

describe("LensForm", () => {
  const onDone = vi.fn();
  const cameras = [
    {
      id: "cam-1",
      user_id: "user-123",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = "user-123";
  });

  it("renders form fields for new lens", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    expect(screen.getByLabelText("name")).toBeDefined();
    expect(screen.getByLabelText("make")).toBeDefined();
    expect(screen.getByLabelText("focalLength")).toBeDefined();
    expect(screen.getByLabelText("maxAperture")).toBeDefined();
  });

  it("shows add button for new lens", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    expect(screen.getByText("add")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("shows save button for editing existing lens", () => {
    const lens = {
      id: "lens-1",
      user_id: "user-123",
      name: "Nikkor 50mm f/1.4",
      make: "Nikon",
      focal_length: 50,
      max_aperture: 1.4,
      camera_id: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<LensForm lens={lens} cameras={cameras} onDone={onDone} />);
    expect(screen.getByText("save")).toBeDefined();
  });

  it("pre-fills fields when editing", () => {
    const lens = {
      id: "lens-1",
      user_id: "user-123",
      name: "Nikkor 50mm f/1.4",
      make: "Nikon",
      focal_length: 50,
      max_aperture: 1.4,
      camera_id: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<LensForm lens={lens} cameras={cameras} onDone={onDone} />);
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe(
      "Nikkor 50mm f/1.4",
    );
    expect((screen.getByLabelText("make") as HTMLInputElement).value).toBe(
      "Nikon",
    );
  });

  it("calls onDone when cancel is clicked", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(onDone).toHaveBeenCalled();
  });

  it("renders linked camera select with cameras", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    expect(screen.getByLabelText("linkedCamera")).toBeDefined();
  });

  it("renders zoom lens toggle", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    expect(screen.getByLabelText("zoomLens")).toBeDefined();
  });

  it("shows zoom fields when toggle is enabled", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    const toggle = screen.getByLabelText("zoomLens");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("focalLengthMax")).toBeDefined();
    expect(screen.getByLabelText("minAperture")).toBeDefined();
  });

  it("hides zoom fields by default for new lens", () => {
    render(<LensForm cameras={cameras} onDone={onDone} />);
    expect(screen.queryByLabelText("focalLengthMax")).toBeNull();
    expect(screen.queryByLabelText("minAperture")).toBeNull();
  });

  it("auto-enables zoom toggle when editing a zoom lens", () => {
    const zoomLens = {
      id: "lens-z",
      user_id: "user-123",
      name: "Nikkor 24-70mm f/2.8",
      make: "Nikon",
      focal_length: 24,
      max_aperture: 2.8,
      focal_length_max: 70,
      min_aperture: null,
      camera_id: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };
    render(<LensForm lens={zoomLens} cameras={cameras} onDone={onDone} />);
    expect(screen.getByLabelText("focalLengthMax")).toBeDefined();
  });
});
