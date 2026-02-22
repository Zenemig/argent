import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

let mockUserId: string | null | undefined = "user-123";
vi.mock("@/hooks/useUserId", () => ({
  useUserId: () => mockUserId,
}));

let mockIsProUser = false;
let mockIsAuthenticated = true;
vi.mock("@/hooks/useUserTier", () => ({
  useUserTier: () => ({
    tier: mockIsProUser ? "pro" : "free",
    isProUser: mockIsProUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

let mockSyncState = "synced";
let mockFailedCount = 0;
let mockPendingCount = 0;
let mockLastError: string | null = null;
const mockSyncNow = vi.fn();
vi.mock("@/hooks/useSync", () => ({
  useSync: () => ({
    syncState: mockSyncState,
    failedCount: mockFailedCount,
    pendingCount: mockPendingCount,
    lastError: mockLastError,
    syncNow: mockSyncNow,
  }),
}));

// Mock SyncDetailsSheet to track open state
let sheetOpenState = false;
vi.mock("@/components/sync-details-sheet", () => ({
  SyncDetailsSheet: ({ open }: { open: boolean }) => {
    sheetOpenState = open;
    return open ? <div data-testid="sync-details-sheet">Sheet Open</div> : null;
  },
}));

import { SyncStatus } from "./sync-status";

describe("SyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = "user-123";
    mockIsProUser = false;
    mockIsAuthenticated = true;
    mockSyncState = "synced";
    mockFailedCount = 0;
    mockPendingCount = 0;
    mockLastError = null;
    sheetOpenState = false;
  });

  it("returns null when not authenticated", () => {
    mockIsAuthenticated = false;
    const { container } = render(<SyncStatus />);
    expect(container.innerHTML).toBe("");
  });

  it("shows 'localOnly' label for free users", () => {
    mockIsProUser = false;
    render(<SyncStatus />);
    expect(screen.getByText("localOnly")).toBeDefined();
  });

  it("shows info toast when free user clicks", async () => {
    const { toast } = await import("sonner");
    mockIsProUser = false;
    render(<SyncStatus />);
    fireEvent.click(screen.getByText("localOnly"));
    expect(toast.info).toHaveBeenCalledWith("syncTeaser");
  });

  it("shows synced indicator for pro users", () => {
    mockIsProUser = true;
    mockSyncState = "synced";
    render(<SyncStatus />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("synced");
  });

  it("opens sheet when pro user clicks on synced state", () => {
    mockIsProUser = true;
    mockSyncState = "synced";
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(sheetOpenState).toBe(true);
  });

  it("opens sheet when pro user clicks on error state", () => {
    mockIsProUser = true;
    mockSyncState = "error";
    mockFailedCount = 2;
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(sheetOpenState).toBe(true);
  });

  it("opens sheet when pro user clicks on offline state", () => {
    mockIsProUser = true;
    mockSyncState = "offline";
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(sheetOpenState).toBe(true);
  });
});
