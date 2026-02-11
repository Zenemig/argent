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

vi.mock("./roll-card", () => ({
  RollCard: ({ roll }: { roll: { id: string } }) => (
    <div data-testid={`roll-card-${roll.id}`}>Roll</div>
  ),
}));

vi.mock("./dashboard-filters", () => ({
  DashboardFilters: () => <div data-testid="filters" />,
}));

vi.mock("./load-roll-wizard", () => ({
  LoadRollWizard: () => <div data-testid="wizard" />,
}));

vi.mock("@/lib/filter-rolls", () => ({
  filterAndSortRolls: (rolls: unknown[]) => rolls,
  buildFilmMap: () => new Map(),
}));

import { DashboardContent } from "./dashboard-content";

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders skeleton when userId is undefined", () => {
    mockUserId = undefined;
    mockQueryResults.push(undefined, undefined, undefined, undefined);
    const { container } = render(<DashboardContent />);
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no rolls", () => {
    // rolls, cameras, customFilms, seedFilms
    mockQueryResults.push([], [], [], []);
    render(<DashboardContent />);
    expect(screen.getByText("noRolls")).toBeDefined();
    expect(screen.getByText("noRollsHint")).toBeDefined();
  });

  it("renders roll cards when rolls exist", () => {
    const rolls = [
      { id: "r1", film_id: "f1", camera_id: "c1", status: "active" },
      { id: "r2", film_id: "f2", camera_id: "c2", status: "loaded" },
    ];
    const cameras = [{ id: "c1", name: "Nikon" }];
    mockQueryResults.push(rolls, cameras, [], []);

    render(<DashboardContent />);
    expect(screen.getByTestId("roll-card-r1")).toBeDefined();
    expect(screen.getByTestId("roll-card-r2")).toBeDefined();
  });

  it("renders filters when rolls exist", () => {
    const rolls = [{ id: "r1" }];
    mockQueryResults.push(rolls, [], [], []);
    render(<DashboardContent />);
    expect(screen.getByTestId("filters")).toBeDefined();
  });

  it("renders load new roll button", () => {
    mockQueryResults.push([], [], [], []);
    render(<DashboardContent />);
    expect(screen.getAllByText("loadNew").length).toBeGreaterThanOrEqual(1);
  });

  it("renders page title", () => {
    mockQueryResults.push([], [], [], []);
    render(<DashboardContent />);
    expect(screen.getByText("allRolls")).toBeDefined();
  });
});
