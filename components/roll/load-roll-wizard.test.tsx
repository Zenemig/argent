import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
}));

vi.mock("ulid", () => ({
  ulid: () => "test-roll-ulid",
}));

vi.mock("@/lib/constants", () => ({
  DEFAULT_FRAME_COUNTS: { "35mm": 36, "120": 12, "4x5": 1 },
}));

import { LoadRollWizard } from "./load-roll-wizard";

describe("LoadRollWizard", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders dialog with title when open", () => {
    // cameras, lenses, filmOptions
    mockQueryResults.push([], [], []);
    render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
    expect(screen.getAllByText("loadNew").length).toBeGreaterThanOrEqual(1);
  });

  it("shows camera selection step first", () => {
    mockQueryResults.push([], [], []);
    render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText("selectCamera")).toBeDefined();
  });

  it("shows no camera message when cameras list is empty", () => {
    mockQueryResults.push([], [], []);
    render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText("noCamera")).toBeDefined();
  });

  it("shows camera cards when cameras exist", () => {
    const cameras = [
      {
        id: "cam-1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
      },
    ];
    mockQueryResults.push(cameras, [], []);
    render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText("Nikon FM2")).toBeDefined();
  });

  it("renders step indicators", () => {
    mockQueryResults.push([], [], []);
    render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
    // Three step indicators (1, 2, 3)
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  describe("camera search and filter", () => {
    const cameras = [
      {
        id: "cam-1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
      },
      {
        id: "cam-2",
        name: "Hasselblad 500C",
        make: "Hasselblad",
        format: "120",
        default_frame_count: 12,
      },
      {
        id: "cam-3",
        name: "Canon AE-1",
        make: "Canon",
        format: "35mm",
        default_frame_count: 36,
      },
    ];

    it("renders search input when cameras exist", () => {
      mockQueryResults.push(cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      expect(screen.getByPlaceholderText("searchCamera")).toBeDefined();
    });

    it("filters cameras by name", () => {
      // initial render + re-render after state change
      mockQueryResults.push(cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "FM2" },
      });
      expect(screen.getByText("Nikon FM2")).toBeDefined();
      expect(screen.queryByText("Hasselblad 500C")).toBeNull();
      expect(screen.queryByText("Canon AE-1")).toBeNull();
    });

    it("filters cameras by make", () => {
      mockQueryResults.push(cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "Canon" },
      });
      expect(screen.getByText("Canon AE-1")).toBeDefined();
      expect(screen.queryByText("Nikon FM2")).toBeNull();
    });

    it("search is case-insensitive", () => {
      mockQueryResults.push(cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "nikon" },
      });
      expect(screen.getByText("Nikon FM2")).toBeDefined();
    });

    it("renders format filter pills for unique formats", () => {
      mockQueryResults.push(cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      expect(screen.getByRole("button", { name: "allFormats" })).toBeDefined();
      expect(screen.getByRole("button", { name: "35mm" })).toBeDefined();
      expect(screen.getByRole("button", { name: "120" })).toBeDefined();
    });

    it("filters cameras by format pill", () => {
      mockQueryResults.push(cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole("button", { name: "120" }));
      expect(screen.getByText("Hasselblad 500C")).toBeDefined();
      expect(screen.queryByText("Nikon FM2")).toBeNull();
      expect(screen.queryByText("Canon AE-1")).toBeNull();
    });

    it("combines search and format filter", () => {
      // initial + click pill + type search
      mockQueryResults.push(cameras, [], [], cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole("button", { name: "35mm" }));
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "Canon" },
      });
      expect(screen.getByText("Canon AE-1")).toBeDefined();
      expect(screen.queryByText("Nikon FM2")).toBeNull();
      expect(screen.queryByText("Hasselblad 500C")).toBeNull();
    });

    it("shows no match message when search yields no results", () => {
      mockQueryResults.push(cameras, [], [], cameras, [], []);
      render(<LoadRollWizard open={true} onOpenChange={onOpenChange} />);
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "Leica" },
      });
      expect(screen.getByText("noCameraMatch")).toBeDefined();
    });

    it("resets search and filter on dialog close and reopen", () => {
      // initial + search re-render + close re-render + reopen
      mockQueryResults.push(
        cameras, [], [],  // initial render
        cameras, [], [],  // re-render after search change
        cameras, [], [],  // re-render after resetAndClose
        cameras, [], [],  // reopen render
      );
      const { rerender } = render(
        <LoadRollWizard open={true} onOpenChange={onOpenChange} />,
      );
      // Apply search
      fireEvent.change(screen.getByPlaceholderText("searchCamera"), {
        target: { value: "Nikon" },
      });
      expect(screen.queryByText("Canon AE-1")).toBeNull();

      // Close dialog via close button — triggers resetAndClose
      const closeButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeButton);

      // onOpenChange was called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Reopen with fresh state
      queryCallIndex = 0;
      mockQueryResults.length = 0;
      mockQueryResults.push(cameras, [], []);
      rerender(
        <LoadRollWizard open={true} onOpenChange={onOpenChange} />,
      );

      // All cameras should be visible again (search was reset)
      expect(screen.getByText("Nikon FM2")).toBeDefined();
      expect(screen.getByText("Canon AE-1")).toBeDefined();
      expect(screen.getByText("Hasselblad 500C")).toBeDefined();
    });
  });
});
