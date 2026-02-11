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

vi.mock("ulid", () => ({
  ulid: () => "test-film-ulid",
}));

const mockSyncAdd = vi.fn().mockResolvedValue(undefined);
const mockSyncUpdate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/sync-write", () => ({
  syncAdd: (...args: unknown[]) => mockSyncAdd(...args),
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

vi.mock("@/lib/constants", () => ({
  FILM_FORMATS: ["35mm", "120", "4x5"],
  FILM_PROCESSES: ["C-41", "E-6", "BW"],
  formatLabel: (v: string) => v,
}));

vi.mock("./film-form", () => ({
  FilmForm: () => <div data-testid="film-form" />,
}));

import { FilmCatalog } from "./film-catalog";

describe("FilmCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
    mockUserId = "user-123";
  });

  it("renders skeleton when data is loading", () => {
    mockUserId = undefined;
    mockQueryResults.push(undefined, undefined);
    const { container } = render(<FilmCatalog />);
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no films", () => {
    // filmStocks, customFilms
    mockQueryResults.push([], []);
    render(<FilmCatalog />);
    expect(screen.getByText("emptyFilm")).toBeDefined();
  });

  it("renders film cards when custom films exist", () => {
    const filmStocks: unknown[] = [];
    const customFilms = [
      {
        id: "film-1",
        brand: "Kodak",
        name: "Portra 400",
        iso: 400,
        format: "35mm",
        process: "C-41",
        is_custom: true,
      },
    ];
    mockQueryResults.push(filmStocks, customFilms);
    render(<FilmCatalog />);
    expect(screen.getByText("Kodak Portra 400")).toBeDefined();
  });

  it("renders your films heading", () => {
    mockQueryResults.push([], []);
    render(<FilmCatalog />);
    expect(screen.getByText("yourFilms")).toBeDefined();
  });

  it("renders add custom film button", () => {
    mockQueryResults.push([], []);
    render(<FilmCatalog />);
    expect(screen.getByText("addCustomFilm")).toBeDefined();
  });

  it("renders film catalog section", () => {
    mockQueryResults.push([], []);
    render(<FilmCatalog />);
    expect(screen.getByText("filmCatalog")).toBeDefined();
    expect(screen.getByText("addFromCatalog")).toBeDefined();
  });

  it("shows custom badge for custom films", () => {
    const customFilms = [
      {
        id: "film-1",
        brand: "Kodak",
        name: "Portra 400",
        iso: 400,
        format: "35mm",
        process: "C-41",
        is_custom: true,
      },
    ];
    mockQueryResults.push([], customFilms);
    render(<FilmCatalog />);
    expect(screen.getByText("custom")).toBeDefined();
  });

  it("renders delete button for custom films", () => {
    const customFilms = [
      {
        id: "film-1",
        brand: "Kodak",
        name: "Portra 400",
        iso: 400,
        format: "35mm",
        process: "C-41",
        is_custom: true,
      },
    ];
    mockQueryResults.push([], customFilms);
    render(<FilmCatalog />);
    expect(screen.getByLabelText("delete")).toBeDefined();
  });
});
