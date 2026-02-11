import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

let mockGetUser: ReturnType<typeof vi.fn>;
let mockOnAuthStateChange: ReturnType<typeof vi.fn>;
let mockUnsubscribe: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUnsubscribe = vi.fn();
  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: "user-123" } },
  });
  mockOnAuthStateChange = vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
      onAuthStateChange: (...args: unknown[]) =>
        mockOnAuthStateChange(...args),
    },
  }),
}));

import { useUserId } from "./useUserId";

function TestConsumer() {
  const userId = useUserId();
  return (
    <div>
      <span data-testid="userId">{userId === undefined ? "undefined" : userId === null ? "null" : userId}</span>
    </div>
  );
}

describe("useUserId", () => {
  it("starts as undefined (loading)", () => {
    // Don't resolve getUser yet
    mockGetUser.mockReturnValue(new Promise(() => {}));

    render(<TestConsumer />);
    expect(screen.getByTestId("userId").textContent).toBe("undefined");
  });

  it("returns user ID after getUser resolves", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-abc" } },
    });

    await act(async () => {
      render(<TestConsumer />);
    });

    expect(screen.getByTestId("userId").textContent).toBe("user-abc");
  });

  it("returns null when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await act(async () => {
      render(<TestConsumer />);
    });

    expect(screen.getByTestId("userId").textContent).toBe("null");
  });

  it("returns null on getUser error", async () => {
    mockGetUser.mockRejectedValue(new Error("Auth error"));

    await act(async () => {
      render(<TestConsumer />);
    });

    expect(screen.getByTestId("userId").textContent).toBe("null");
  });

  it("subscribes to auth state changes", async () => {
    await act(async () => {
      render(<TestConsumer />);
    });

    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });
});
