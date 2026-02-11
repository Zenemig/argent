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
const mockSyncNow = vi.fn();
vi.mock("@/hooks/useSync", () => ({
  useSync: () => ({
    syncState: mockSyncState,
    failedCount: mockFailedCount,
    syncNow: mockSyncNow,
  }),
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

  it("calls syncNow when pro user clicks on synced state", () => {
    mockIsProUser = true;
    mockSyncState = "synced";
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSyncNow).toHaveBeenCalled();
  });

  it("shows error toast when pro user clicks on error state", async () => {
    const { toast } = await import("sonner");
    mockIsProUser = true;
    mockSyncState = "error";
    mockFailedCount = 2;
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(toast.error).toHaveBeenCalled();
  });

  it("shows info toast when pro user clicks on offline state", async () => {
    const { toast } = await import("sonner");
    mockIsProUser = true;
    mockSyncState = "offline";
    render(<SyncStatus />);
    fireEvent.click(screen.getByRole("button"));
    expect(toast.info).toHaveBeenCalledWith("offline");
  });
});
