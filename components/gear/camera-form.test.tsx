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
});
