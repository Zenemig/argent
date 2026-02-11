import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let mockUserId: string | null | undefined = "user-123";
vi.mock("./useUserId", () => ({
  useUserId: () => mockUserId,
}));

const mockLiveQueryResults: unknown[] = [];
let queryCallIndex = 0;
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => {
    const result = mockLiveQueryResults[queryCallIndex];
    queryCallIndex++;
    return result;
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    rolls: { where: () => ({ equals: () => ({ filter: () => ({ toArray: () => Promise.resolve([]) }) }) }) },
    frames: { where: () => ({ anyOf: () => ({ toArray: () => Promise.resolve([]) }) }) },
    cameras: { where: () => ({ equals: () => ({ filter: () => ({ toArray: () => Promise.resolve([]) }) }) }) },
    lenses: { where: () => ({ equals: () => ({ filter: () => ({ toArray: () => Promise.resolve([]) }) }) }) },
    films: { where: () => ({ equals: () => ({ filter: () => ({ toArray: () => Promise.resolve([]) }) }) }) },
    filmStock: { toArray: () => Promise.resolve([]) },
  },
}));

vi.mock("@/lib/stats", () => ({
  computeFilmUsage: vi.fn().mockReturnValue([]),
  computeShotsPerMonth: vi.fn().mockReturnValue([]),
  computeCameraUsage: vi.fn().mockReturnValue([]),
  computeFocalLengthUsage: vi.fn().mockReturnValue([]),
  computeAvgFramesPerRoll: vi.fn().mockReturnValue(0),
}));

import { useStats } from "./useStats";

function TestConsumer() {
  const { isLoading, hasData, filmUsage, avgFramesPerRoll } = useStats();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="hasData">{String(hasData)}</span>
      <span data-testid="filmUsage">{JSON.stringify(filmUsage)}</span>
      <span data-testid="avgFrames">{String(avgFramesPerRoll)}</span>
    </div>
  );
}

describe("useStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCallIndex = 0;
    mockUserId = "user-123";
    mockLiveQueryResults.length = 0;
  });

  it("returns loading when userId is undefined", () => {
    mockUserId = undefined;
    // useLiveQuery returns undefined for all queries
    mockLiveQueryResults.push(undefined, undefined, undefined, undefined, undefined, undefined);

    render(<TestConsumer />);
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("hasData").textContent).toBe("false");
  });

  it("returns loading when queries have not resolved", () => {
    // All queries return undefined (not yet loaded)
    mockLiveQueryResults.push(undefined, undefined, undefined, undefined, undefined, undefined);

    render(<TestConsumer />);
    expect(screen.getByTestId("loading").textContent).toBe("true");
  });

  it("returns not loading and hasData false when rolls is empty", () => {
    // rolls, frames, cameras, lenses, customFilms, seedFilms all resolved
    mockLiveQueryResults.push([], [], [], [], [], []);

    render(<TestConsumer />);
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("hasData").textContent).toBe("false");
  });

  it("returns hasData true when rolls exist", () => {
    const rolls = [{ id: "r1", film_id: "f1", camera_id: "c1", status: "active" }];
    const frames = [{ id: "fr1", roll_id: "r1", frame_number: 1 }];
    mockLiveQueryResults.push(rolls, frames, [], [], [], []);

    render(<TestConsumer />);
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("hasData").textContent).toBe("true");
  });
});
