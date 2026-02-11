import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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
  applyTheme: vi.fn(),
}));

vi.mock("@/lib/constants", () => ({
  METERING_MODES: ["Center-weighted", "Spot", "Matrix"],
}));

vi.mock("@/components/upgrade-prompt", () => ({
  UpgradePrompt: () => <div data-testid="upgrade-prompt" />,
}));

import { SettingsContent } from "./settings-content";

describe("SettingsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders language settings card", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("language")).toBeDefined();
  });

  it("renders theme settings card", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("theme")).toBeDefined();
  });

  it("renders default metering card", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("defaultMetering")).toBeDefined();
  });

  it("renders display name card", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("displayName")).toBeDefined();
  });

  it("renders copyright card", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("copyright")).toBeDefined();
  });

  it("renders about card with version", () => {
    mockQueryResults.push(undefined);
    render(<SettingsContent />);
    expect(screen.getByText("about")).toBeDefined();
  });
});
