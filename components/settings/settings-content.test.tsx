import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockNextThemes = { theme: "dark", setTheme: vi.fn() };
vi.mock("next-themes", () => ({
  useTheme: () => mockNextThemes,
}));

let mockUserId: string | null | undefined = "user-123";
vi.mock("@/hooks/useUserId", () => ({
  useUserId: () => mockUserId,
}));

vi.mock("@/hooks/useUserTier", () => ({
  useUserTier: () => ({
    tier: "free",
    isProUser: false,
    isAuthenticated: true,
  }),
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

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { email: "test@example.com" } } }),
    },
  }),
}));

vi.mock("@/lib/settings-helpers", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/constants", () => ({
  METERING_MODES: ["Center-weighted", "Spot", "Matrix"],
}));

vi.mock("@/components/upgrade-prompt", () => ({
  UpgradePrompt: () => <div data-testid="upgrade-prompt" />,
}));

vi.mock("./delete-account-section", () => ({
  DeleteAccountSection: () => <div data-testid="delete-account-section" />,
}));

const mockCaptureImage = vi.fn();
vi.mock("@/lib/image-capture", () => ({
  captureImage: (...args: unknown[]) => mockCaptureImage(...args),
}));

vi.mock("@/lib/avatar", () => ({
  getLocalAvatar: vi.fn().mockResolvedValue(null),
  setLocalAvatar: vi.fn().mockResolvedValue(undefined),
  uploadAvatar: vi.fn().mockResolvedValue("user-123/avatar.jpg"),
}));

vi.mock("@/lib/user-avatar", () => ({
  getUserAvatar: () => ({
    icon: "camera" as const,
    bgColor: "bg-[#F2B5A7]",
    iconColor: "text-[#6B2A1A]",
  }),
}));

import { SettingsContent } from "./settings-content";

describe("SettingsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
    mockNextThemes.theme = "dark";
    mockNextThemes.setTheme = vi.fn();
    mockCaptureImage.mockResolvedValue({ error: "no_file" });
  });

  it("renders language setting row", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("language")).toBeDefined();
  });

  it("renders theme setting row", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("theme")).toBeDefined();
  });

  it("renders default metering setting row", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("defaultMetering")).toBeDefined();
  });

  it("renders display name setting row", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("displayName")).toBeDefined();
  });

  it("renders copyright setting row", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("copyright")).toBeDefined();
  });

  it("renders about footer with version", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("about · version 0.1.0")).toBeDefined();
  });

  it("renders preferences section header", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("preferences")).toBeDefined();
  });

  it("renders metadata section header", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("metadata")).toBeDefined();
  });

  it("renders section headers as h2 elements", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0].textContent).toBe("preferences");
    expect(headings[1].textContent).toBe("metadata");
  });

  it("renders avatar button with changeAvatar label", async () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    // Account section renders after async getUser resolves
    const { findByLabelText } = screen;
    const avatarBtn = await findByLabelText("changeAvatar");
    expect(avatarBtn).toBeDefined();
  });
});
