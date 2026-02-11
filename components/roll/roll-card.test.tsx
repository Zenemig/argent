import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
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

vi.mock("@/lib/roll-lifecycle", () => ({
  STATUS_COLORS: {
    loaded: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    finished: "bg-yellow-100 text-yellow-800",
    developed: "bg-purple-100 text-purple-800",
    scanned: "bg-teal-100 text-teal-800",
    archived: "bg-gray-100 text-gray-800",
    discarded: "bg-red-100 text-red-800",
  },
}));

import { RollCard } from "./roll-card";
import type { Roll } from "@/lib/types";

function makeRoll(overrides: Partial<Roll> = {}): Roll {
  return {
    id: "roll-001",
    user_id: "user-1",
    camera_id: "cam-1",
    film_id: "film-1",
    lens_id: null,
    status: "active",
    frame_count: 36,
    ei: 400,
    push_pull: 0,
    lab_name: null,
    dev_notes: null,
    notes: null,
    start_date: Date.now(),
    finish_date: null,
    develop_date: null,
    scan_date: null,
    deleted_at: null,
    updated_at: Date.now(),
    created_at: Date.now(),
    ...overrides,
  } as Roll;
}

describe("RollCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockQueryResults.length = 0;
  });

  it("renders status badge", () => {
    // camera, film, frameCount
    mockQueryResults.push(
      { name: "Nikon FM2" },
      { brand: "Kodak", name: "Portra 400" },
      5,
    );
    render(<RollCard roll={makeRoll()} />);
    expect(screen.getByText("status.active")).toBeDefined();
  });

  it("renders film name when available", () => {
    mockQueryResults.push(
      { name: "Nikon FM2" },
      { brand: "Kodak", name: "Portra 400" },
      5,
    );
    render(<RollCard roll={makeRoll()} />);
    expect(screen.getByText("Kodak Portra 400")).toBeDefined();
  });

  it("links to roll detail page", () => {
    mockQueryResults.push(null, null, 0);
    render(<RollCard roll={makeRoll({ id: "roll-xyz" })} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/roll/roll-xyz");
  });

  it("shows EI and push/pull when present", () => {
    mockQueryResults.push(null, null, 0);
    render(
      <RollCard roll={makeRoll({ ei: 800, push_pull: 1 })} />,
    );
    expect(screen.getByText("EI 800 (+1)")).toBeDefined();
  });

  it("applies reduced opacity for discarded rolls", () => {
    mockQueryResults.push(null, null, 0);
    const { container } = render(
      <RollCard roll={makeRoll({ status: "discarded" })} />,
    );
    // The Card element should have opacity-60 class
    const card = container.querySelector("[class*='opacity-60']");
    expect(card).not.toBeNull();
  });
});
