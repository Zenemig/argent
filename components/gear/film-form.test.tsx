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
  ulid: () => "test-film-ulid",
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
}));

vi.mock("@/lib/constants", () => ({
  FILM_FORMATS: ["35mm", "120", "4x5"],
  FILM_PROCESSES: ["C-41", "E-6", "BW"],
}));

import { FilmForm } from "./film-form";

describe("FilmForm", () => {
  const onDone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = "user-123";
  });

  it("renders form fields", () => {
    render(<FilmForm onDone={onDone} />);
    expect(screen.getByLabelText("brand")).toBeDefined();
    expect(screen.getByLabelText("name")).toBeDefined();
    expect(screen.getByLabelText("iso")).toBeDefined();
  });

  it("shows add and cancel buttons", () => {
    render(<FilmForm onDone={onDone} />);
    expect(screen.getByText("add")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("calls onDone when cancel is clicked", () => {
    render(<FilmForm onDone={onDone} />);
    fireEvent.click(screen.getByText("cancel"));
    expect(onDone).toHaveBeenCalled();
  });

  it("has default ISO of 400", () => {
    render(<FilmForm onDone={onDone} />);
    expect((screen.getByLabelText("iso") as HTMLInputElement).value).toBe(
      "400",
    );
  });

  it("does not submit when brand is empty", () => {
    render(<FilmForm onDone={onDone} />);
    const nameInput = screen.getByLabelText("name");
    fireEvent.change(nameInput, { target: { value: "Portra 400" } });
    fireEvent.submit(screen.getByText("add").closest("form")!);
    expect(mockSyncAdd).not.toHaveBeenCalled();
  });
});
