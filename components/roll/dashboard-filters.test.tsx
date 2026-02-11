import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { DashboardFilters } from "./dashboard-filters";

describe("DashboardFilters", () => {
  const defaultProps = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    statusFilter: "all",
    onStatusFilterChange: vi.fn(),
    cameraFilter: "all",
    onCameraFilterChange: vi.fn(),
    filmFilter: "all",
    onFilmFilterChange: vi.fn(),
    sortBy: "date",
    onSortByChange: vi.fn(),
    cameras: [],
    films: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders search input", () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: "search" })).toBeDefined();
  });

  it("calls onSearchChange when typing in search", () => {
    render(<DashboardFilters {...defaultProps} />);
    const input = screen.getByRole("textbox", { name: "search" });
    fireEvent.change(input, { target: { value: "portra" } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("portra");
  });

  it("renders status filter select", () => {
    render(<DashboardFilters {...defaultProps} />);
    // There should be multiple select triggers (status, sort, etc.)
    const triggers = screen.getAllByRole("combobox");
    expect(triggers.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render camera filter when no cameras", () => {
    const { container } = render(
      <DashboardFilters {...defaultProps} cameras={[]} />,
    );
    // With 0 cameras, camera filter select is not rendered
    const triggers = container.querySelectorAll('[role="combobox"]');
    expect(triggers.length).toBe(2); // just status + sort
  });

  it("renders camera filter when cameras exist", () => {
    const cameras = [
      {
        id: "cam1",
        user_id: "u1",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm" as const,
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: Date.now(),
        created_at: Date.now(),
      },
    ];
    render(<DashboardFilters {...defaultProps} cameras={cameras} />);
    const triggers = screen.getAllByRole("combobox");
    expect(triggers.length).toBeGreaterThanOrEqual(3);
  });
});
