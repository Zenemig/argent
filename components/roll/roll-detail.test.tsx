import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
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

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("./shot-logger", () => ({
  ShotLogger: () => <div data-testid="shot-logger" />,
}));

vi.mock("./roll-lifecycle", () => ({
  RollLifecycle: () => <div data-testid="roll-lifecycle" />,
}));

vi.mock("./roll-actions-menu", () => ({
  RollActionsMenu: () => <div data-testid="roll-actions" />,
}));

vi.mock("@/components/export/xmp-export-dialog", () => ({
  ExportDialog: () => <div data-testid="export-dialog" />,
}));

import { RollDetail } from "./roll-detail";

describe("RollDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
  });

  it("renders skeleton when roll is not yet loaded", () => {
    // roll=undefined, camera=undefined, frameCount=undefined, film=undefined
    mockQueryResults.push(undefined, undefined, undefined, undefined);
    const { container } = render(<RollDetail rollId="roll-001" />);
    // Skeleton elements should be present
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders roll detail when data is loaded", () => {
    const roll = {
      id: "roll-001",
      user_id: "user-1",
      camera_id: "cam-1",
      film_id: "film-1",
      status: "active",
      frame_count: 36,
      ei: 400,
      push_pull: 0,
      start_date: Date.now(),
      finish_date: null,
      develop_date: null,
      scan_date: null,
      lab_name: null,
      dev_notes: null,
      notes: null,
    };
    mockQueryResults.push(
      roll,
      { name: "Nikon FM2" },
      5,
      { brand: "Kodak", name: "Portra 400" },
    );

    render(<RollDetail rollId="roll-001" />);
    expect(screen.getByText("Kodak Portra 400")).toBeDefined();
    expect(screen.getByTestId("roll-lifecycle")).toBeDefined();
    expect(screen.getByTestId("shot-logger")).toBeDefined();
  });

  it("shows back link to home", () => {
    const roll = {
      id: "roll-001",
      user_id: "user-1",
      camera_id: "cam-1",
      film_id: "film-1",
      status: "active",
      frame_count: 36,
      ei: 400,
      push_pull: 0,
      start_date: Date.now(),
    };
    mockQueryResults.push(roll, null, 0, null);

    render(<RollDetail rollId="roll-001" />);
    const backLink = screen.getByRole("link");
    expect(backLink.getAttribute("href")).toBe("/");
  });
});
