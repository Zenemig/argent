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

vi.mock("@/lib/roll-lifecycle", () => ({
  STATUS_ORDER: ["loaded", "active", "finished", "developed", "scanned", "archived"],
  getNextStatus: (s: string) => {
    const order = ["loaded", "active", "finished", "developed", "scanned", "archived"];
    const idx = order.indexOf(s);
    return idx < order.length - 1 ? order[idx + 1] : null;
  },
  getPrevStatus: (s: string) => {
    const order = ["loaded", "active", "finished", "developed", "scanned", "archived"];
    const idx = order.indexOf(s);
    return idx > 0 ? order[idx - 1] : null;
  },
  getAdvanceFields: (nextStatus: string) => ({
    status: nextStatus,
    updated_at: Date.now(),
  }),
  getUndoFields: (_current: string, prev: string) => ({
    status: prev,
    updated_at: Date.now(),
  }),
  ACTION_KEYS: {
    finished: "finish",
    developed: "develop",
    scanned: "scan",
    archived: "archive",
  } as Record<string, string>,
}));

// jsdom stubs for scroll-related APIs
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Element.prototype.scrollIntoView = vi.fn();

// jsdom does not implement ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

import { RollLifecycle } from "./roll-lifecycle";
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

describe("RollLifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders status timeline with all statuses", () => {
    render(<RollLifecycle roll={makeRoll()} />);
    expect(screen.getByText("status.loaded")).toBeDefined();
    expect(screen.getByText("status.active")).toBeDefined();
    expect(screen.getByText("status.finished")).toBeDefined();
    expect(screen.getByText("status.developed")).toBeDefined();
    expect(screen.getByText("status.scanned")).toBeDefined();
    expect(screen.getByText("status.archived")).toBeDefined();
  });

  it("renders advance button for non-terminal status", () => {
    render(<RollLifecycle roll={makeRoll({ status: "active" })} />);
    expect(screen.getByText("actions.finish")).toBeDefined();
  });

  it("renders undo button when not at first status", () => {
    render(<RollLifecycle roll={makeRoll({ status: "active" })} />);
    expect(screen.getByLabelText("undoStatus")).toBeDefined();
  });

  it("does not render undo button at loaded status", () => {
    render(<RollLifecycle roll={makeRoll({ status: "loaded" })} />);
    expect(screen.queryByLabelText("undoStatus")).toBeNull();
  });

  it("calls syncUpdate when advancing status", async () => {
    render(<RollLifecycle roll={makeRoll({ status: "active" })} />);
    fireEvent.click(screen.getByText("actions.finish"));
    expect(mockSyncUpdate).toHaveBeenCalledWith(
      "rolls",
      "roll-001",
      expect.objectContaining({ status: "finished" }),
    );
  });

  it("shows develop dialog when advancing to developed", () => {
    render(<RollLifecycle roll={makeRoll({ status: "finished" })} />);
    fireEvent.click(screen.getByText("actions.develop"));
    // Dialog should open with lab name input
    expect(screen.getByLabelText("labName")).toBeDefined();
  });

  it("shows discarded banner for discarded rolls", () => {
    render(<RollLifecycle roll={makeRoll({ status: "discarded" as Roll["status"] })} />);
    expect(screen.getByText("status.discarded")).toBeDefined();
  });

  it("shows discard reason when present", () => {
    render(
      <RollLifecycle
        roll={makeRoll({
          status: "discarded" as Roll["status"],
          discard_reason: "light_leak",
        } as Partial<Roll>)}
      />,
    );
    expect(screen.getByText("discardReason.light_leak")).toBeDefined();
  });

  describe("scroll affordance", () => {
    it("renders fade overlays as aria-hidden", () => {
      const { container } = render(<RollLifecycle roll={makeRoll()} />);
      const timeline = container.querySelector("[data-testid='status-timeline']")!.parentElement!;
      const fades = timeline.querySelectorAll(":scope > [aria-hidden='true']");
      expect(fades.length).toBe(2);
    });

    it("hides scrollbar on the status timeline", () => {
      const { container } = render(<RollLifecycle roll={makeRoll()} />);
      const scrollable = container.querySelector("[data-testid='status-timeline']");
      expect(scrollable).toBeDefined();
      expect(scrollable!.className).toContain("overflow-x-auto");
    });

    it("sets ref on the current status pill", () => {
      const { container } = render(
        <RollLifecycle roll={makeRoll({ status: "finished" })} />,
      );
      const activePill = container.querySelector("[data-testid='status-pill-active']");
      expect(activePill).toBeDefined();
      expect(activePill!.textContent).toBe("status.finished");
    });

    it("scrolls the active pill into view on mount", () => {
      render(<RollLifecycle roll={makeRoll({ status: "finished" })} />);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ inline: "center", block: "nearest" }),
      );
    });

    it("shows left fade after scrolling right", () => {
      const { container } = render(<RollLifecycle roll={makeRoll()} />);
      const scrollable = container.querySelector("[data-testid='status-timeline']")!;

      Object.defineProperty(scrollable, "scrollLeft", { value: 20, configurable: true });
      Object.defineProperty(scrollable, "scrollWidth", { value: 400, configurable: true });
      Object.defineProperty(scrollable, "clientWidth", { value: 300, configurable: true });

      fireEvent.scroll(scrollable);

      const parent = scrollable.parentElement!;
      const leftFade = parent.querySelector(":scope > [aria-hidden='true']:first-child")!;
      expect(leftFade.className).toContain("opacity-100");
    });
  });
});
