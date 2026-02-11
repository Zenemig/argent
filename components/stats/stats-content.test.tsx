import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock recharts to avoid rendering actual SVG charts in jsdom
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CartesianGrid: () => null,
}));

let mockStatsReturn: Record<string, unknown> = {};
vi.mock("@/hooks/useStats", () => ({
  useStats: () => mockStatsReturn,
}));

import { StatsContent } from "./stats-content";

describe("StatsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatsReturn = {};
  });

  it("renders skeleton when loading", () => {
    mockStatsReturn = { isLoading: true, hasData: false };
    const { container } = render(<StatsContent />);
    expect(screen.getByText("title")).toBeDefined();
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no data", () => {
    mockStatsReturn = { isLoading: false, hasData: false };
    render(<StatsContent />);
    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("noData")).toBeDefined();
  });

  it("renders chart cards when data exists", () => {
    mockStatsReturn = {
      isLoading: false,
      hasData: true,
      filmUsage: [{ name: "Portra 400", count: 5 }],
      shotsPerMonth: [{ month: "Jan", count: 10 }],
      cameraUsage: [{ name: "Nikon FM2", count: 3 }],
      focalLengthUsage: [{ focalLength: "50mm", count: 8 }],
      avgFramesPerRoll: 24,
    };
    render(<StatsContent />);
    expect(screen.getByText("mostUsedFilm")).toBeDefined();
    expect(screen.getByText("shotsPerMonth")).toBeDefined();
    expect(screen.getByText("mostUsedCamera")).toBeDefined();
    expect(screen.getByText("mostUsedFocalLength")).toBeDefined();
    expect(screen.getByText("avgFramesPerRoll")).toBeDefined();
    expect(screen.getByText("24")).toBeDefined();
  });

  it("does not render empty chart sections", () => {
    mockStatsReturn = {
      isLoading: false,
      hasData: true,
      filmUsage: [],
      shotsPerMonth: [],
      cameraUsage: [],
      focalLengthUsage: [],
      avgFramesPerRoll: undefined,
    };
    render(<StatsContent />);
    expect(screen.queryByText("mostUsedFilm")).toBeNull();
    expect(screen.queryByText("shotsPerMonth")).toBeNull();
    expect(screen.queryByText("mostUsedCamera")).toBeNull();
    expect(screen.queryByText("mostUsedFocalLength")).toBeNull();
    expect(screen.queryByText("avgFramesPerRoll")).toBeNull();
  });

  it("renders title on all states", () => {
    mockStatsReturn = { isLoading: false, hasData: true };
    render(<StatsContent />);
    expect(screen.getByText("title")).toBeDefined();
  });
});
