import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

import { DiscardRollDialog } from "./discard-roll-dialog";

describe("DiscardRollDialog", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders dialog with title when open", () => {
    render(
      <DiscardRollDialog
        open={true}
        onOpenChange={onOpenChange}
        rollId="roll-001"
      />,
    );
    expect(screen.getAllByText("discardRoll").length).toBeGreaterThanOrEqual(1);
  });

  it("renders reason radio buttons", () => {
    render(
      <DiscardRollDialog
        open={true}
        onOpenChange={onOpenChange}
        rollId="roll-001"
      />,
    );
    expect(screen.getByText("discardReason.lost_stolen")).toBeDefined();
    expect(screen.getByText("discardReason.light_leak")).toBeDefined();
    expect(screen.getByText("discardReason.damaged")).toBeDefined();
    expect(screen.getByText("discardReason.lab_error")).toBeDefined();
    expect(screen.getByText("discardReason.other")).toBeDefined();
  });

  it("renders notes textarea", () => {
    render(
      <DiscardRollDialog
        open={true}
        onOpenChange={onOpenChange}
        rollId="roll-001"
      />,
    );
    expect(screen.getByLabelText("discardNotesLabel")).toBeDefined();
  });

  it("calls syncUpdate with discard fields on confirm", async () => {
    render(
      <DiscardRollDialog
        open={true}
        onOpenChange={onOpenChange}
        rollId="roll-001"
      />,
    );
    // Click the destructive confirm button inside the dialog
    const dialog = screen.getByRole("dialog");
    const confirmButton = dialog.querySelector("button[type='submit']") ??
      dialog.querySelector("button.bg-destructive") ??
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "discardRoll",
      );
    fireEvent.click(confirmButton!);

    expect(mockSyncUpdate).toHaveBeenCalledWith(
      "rolls",
      "roll-001",
      expect.objectContaining({
        status: "discarded",
        discard_reason: "lost_stolen",
      }),
    );
  });

  it("calls onOpenChange(false) on cancel", () => {
    render(
      <DiscardRollDialog
        open={true}
        onOpenChange={onOpenChange}
        rollId="roll-001"
      />,
    );
    fireEvent.click(screen.getByText("cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
