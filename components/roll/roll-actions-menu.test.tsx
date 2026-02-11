import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("./discard-roll-dialog", () => ({
  DiscardRollDialog: () => <div data-testid="discard-dialog" />,
}));

import { RollActionsMenu } from "./roll-actions-menu";
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

describe("RollActionsMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the menu trigger button", () => {
    render(<RollActionsMenu roll={makeRoll()} frameCount={5} />);
    // MoreVertical icon button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the discard dialog component", () => {
    render(<RollActionsMenu roll={makeRoll()} frameCount={5} />);
    expect(screen.getByTestId("discard-dialog")).toBeDefined();
  });
});
