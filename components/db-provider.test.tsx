import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockClose = vi.fn();
const mockSeedFilmStocks = vi.fn().mockResolvedValue(undefined);
const mockMigrateFromLegacyDb = vi.fn().mockResolvedValue({ migrated: false, rowCount: 0 });

vi.mock("@/lib/db", () => ({
  createArgentDb: () => ({
    _syncMeta: {
      get: (...args: unknown[]) => mockGet(...args),
      put: (...args: unknown[]) => mockPut(...args),
    },
    filmStock: {},
    close: (...args: unknown[]) => mockClose(...args),
  }),
}));

vi.mock("@/lib/db-migration", () => ({
  migrateFromLegacyDb: (...args: unknown[]) => mockMigrateFromLegacyDb(...args),
}));

vi.mock("@/lib/seed", () => ({
  seedFilmStocks: (...args: unknown[]) => mockSeedFilmStocks(...args),
}));

import { DbProvider } from "./db-provider";

describe("DbProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: nothing seeded yet
    mockGet.mockResolvedValue(undefined);
    mockPut.mockResolvedValue(undefined);
  });

  it("renders nothing while initializing", () => {
    // Never resolve to keep in loading state
    mockGet.mockReturnValue(new Promise(() => {}));
    render(
      <DbProvider userId="test-user-id">
        <div data-testid="child">Ready</div>
      </DbProvider>,
    );
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders children after seeding completes", async () => {
    await act(async () => {
      render(
        <DbProvider userId="test-user-id">
          <div data-testid="child">Ready</div>
        </DbProvider>,
      );
    });

    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("seeds film stocks on first run", async () => {
    await act(async () => {
      render(
        <DbProvider userId="test-user-id">
          <div>Ready</div>
        </DbProvider>,
      );
    });

    expect(mockSeedFilmStocks).toHaveBeenCalled();
    expect(mockPut).toHaveBeenCalledWith({ key: "seeded", value: "true" });
  });

  it("skips seeding if already seeded", async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "seeded") return Promise.resolve({ key: "seeded", value: "true" });
      return Promise.resolve(undefined);
    });

    await act(async () => {
      render(
        <DbProvider userId="test-user-id">
          <div>Ready</div>
        </DbProvider>,
      );
    });

    expect(mockSeedFilmStocks).not.toHaveBeenCalled();
  });
});
