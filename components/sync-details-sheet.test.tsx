import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const mockRetryFailedEntries = vi.fn().mockResolvedValue(undefined);
const mockClearFailedEntries = vi.fn().mockResolvedValue(undefined);
let mockFailedSummary = new Map();
const mockGetFailedEntrySummary = vi
  .fn()
  .mockImplementation(() => Promise.resolve(mockFailedSummary));

vi.mock("@/lib/sync-engine", () => ({
  retryFailedEntries: (...args: unknown[]) =>
    mockRetryFailedEntries(...args),
  clearFailedEntries: (...args: unknown[]) =>
    mockClearFailedEntries(...args),
  getFailedEntrySummary: (...args: unknown[]) =>
    mockGetFailedEntrySummary(...args),
}));

let mockIsPersisted: boolean | null = true;
vi.mock("@/components/db-provider", () => ({
  useStoragePersisted: () => mockIsPersisted,
}));

let mockConflicts: Array<{
  id: number;
  table: string;
  entity_id: string;
  resolved_by: string;
  created_at: number;
}> = [];

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: () => unknown) => {
    // Return mock conflicts data
    return mockConflicts;
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    _syncConflicts: {
      orderBy: () => ({
        reverse: () => ({
          limit: () => ({
            toArray: () => Promise.resolve(mockConflicts),
          }),
        }),
      }),
    },
    _syncMeta: {
      get: () => Promise.resolve(undefined),
    },
  },
}));

// Mock radix dialog (Sheet uses Dialog primitive) to render children directly
vi.mock("radix-ui", () => {
  const React = require("react");
  return {
    Dialog: {
      Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
        open ? React.createElement("div", { "data-slot": "sheet" }, children) : null,
      Portal: ({ children }: { children: React.ReactNode }) =>
        React.createElement("div", null, children),
      Overlay: ({ children, ...props }: React.ComponentProps<"div">) =>
        React.createElement("div", props, children),
      Content: ({ children, ...props }: React.ComponentProps<"div">) =>
        React.createElement("div", props, children),
      Title: ({ children, ...props }: React.ComponentProps<"h2">) =>
        React.createElement("h2", props, children),
      Description: ({ children, ...props }: React.ComponentProps<"p">) =>
        React.createElement("p", props, children),
      Close: ({ children, ...props }: React.ComponentProps<"button">) =>
        React.createElement("button", props, children),
      Trigger: ({ children, ...props }: React.ComponentProps<"button">) =>
        React.createElement("button", props, children),
    },
  };
});

import { SyncDetailsSheet } from "./sync-details-sheet";

describe("SyncDetailsSheet", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    syncState: "synced" as const,
    pendingCount: 3,
    failedCount: 2,
    lastError: null as string | null,
    syncNow: vi.fn(),
    isProUser: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPersisted = true;
    mockConflicts = [];
    mockFailedSummary = new Map();
  });

  it("renders pending and failed counts", () => {
    render(<SyncDetailsSheet {...defaultProps} />);
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });

  it("Sync Now calls syncNow", () => {
    render(<SyncDetailsSheet {...defaultProps} />);
    const btn = screen.getByRole("button", { name: "details.syncNow" });
    fireEvent.click(btn);
    expect(defaultProps.syncNow).toHaveBeenCalled();
  });

  it("Retry Failed is visible only when failedCount > 0", () => {
    const { rerender } = render(
      <SyncDetailsSheet {...defaultProps} failedCount={0} />,
    );
    expect(
      screen.queryByRole("button", { name: "details.retryFailed" }),
    ).toBeNull();

    rerender(<SyncDetailsSheet {...defaultProps} failedCount={2} />);
    expect(
      screen.getByRole("button", { name: "details.retryFailed" }),
    ).toBeDefined();
  });

  it("Discard Failed shows confirmation on click", async () => {
    render(<SyncDetailsSheet {...defaultProps} failedCount={2} />);
    const btn = screen.getByRole("button", { name: "details.discardFailed" });
    fireEvent.click(btn);

    // Should show confirm text
    await waitFor(() => {
      expect(screen.getByText("details.discardConfirm")).toBeDefined();
    });
  });

  it("shows upgrade prompt for free tier", () => {
    render(<SyncDetailsSheet {...defaultProps} isProUser={false} />);
    expect(screen.getByText("syncTeaser")).toBeDefined();
  });

  it("shows storage granted status", () => {
    mockIsPersisted = true;
    render(<SyncDetailsSheet {...defaultProps} />);
    expect(screen.getByText("details.storageGranted")).toBeDefined();
  });

  it("shows best effort storage status when not persisted", () => {
    mockIsPersisted = false;
    render(<SyncDetailsSheet {...defaultProps} />);
    expect(screen.getByText("details.storageNotGranted")).toBeDefined();
  });

  it("shows recent conflicts when available", () => {
    mockConflicts = [
      {
        id: 1,
        table: "cameras",
        entity_id: "01HTEST000000",
        resolved_by: "server_wins",
        created_at: Date.now(),
      },
    ];
    render(<SyncDetailsSheet {...defaultProps} />);
    expect(screen.getByText("details.conflicts")).toBeDefined();
  });
});
