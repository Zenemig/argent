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
    expect(screen.getByText("loadNew")).toBeDefined();
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
});
