import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { UserTierProvider, useUserTier } from "./useUserTier";

// Track the mock tier value returned by Supabase
let mockTier: string | null = "free";
let mockError: boolean = false;
let mockUserId = "guest";

vi.mock("@/hooks/useUserId", () => ({
  useUserId: () => mockUserId,
}));

vi.mock("@/lib/guest", () => ({
  GUEST_USER_ID: "guest",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve(
              mockError
                ? { data: null, error: { message: "fail" } }
                : { data: mockTier ? { tier: mockTier } : null, error: null },
            ),
        }),
      }),
    }),
  }),
}));

function TestConsumer() {
  const { tier, isProUser, isAuthenticated } = useUserTier();
  return (
    <div>
      <span data-testid="tier">{tier}</span>
      <span data-testid="isPro">{String(isProUser)}</span>
      <span data-testid="isAuth">{String(isAuthenticated)}</span>
    </div>
  );
}

describe("useUserTier", () => {
  beforeEach(() => {
    mockTier = "free";
    mockError = false;
    mockUserId = "guest";
  });

  it("returns guest tier when user is not authenticated", async () => {
    mockUserId = "guest";

    await act(async () => {
      render(
        <UserTierProvider>
          <TestConsumer />
        </UserTierProvider>,
      );
    });

    expect(screen.getByTestId("tier").textContent).toBe("guest");
    expect(screen.getByTestId("isPro").textContent).toBe("false");
    expect(screen.getByTestId("isAuth").textContent).toBe("false");
  });

  it("returns free tier for authenticated user with free profile", async () => {
    mockUserId = "user-123";
    mockTier = "free";

    await act(async () => {
      render(
        <UserTierProvider>
          <TestConsumer />
        </UserTierProvider>,
      );
    });

    expect(screen.getByTestId("tier").textContent).toBe("free");
    expect(screen.getByTestId("isPro").textContent).toBe("false");
    expect(screen.getByTestId("isAuth").textContent).toBe("true");
  });

  it("returns pro tier for authenticated user with pro profile", async () => {
    mockUserId = "user-456";
    mockTier = "pro";

    await act(async () => {
      render(
        <UserTierProvider>
          <TestConsumer />
        </UserTierProvider>,
      );
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(screen.getByTestId("isPro").textContent).toBe("true");
    expect(screen.getByTestId("isAuth").textContent).toBe("true");
  });

  it("falls back to free tier on Supabase error", async () => {
    mockUserId = "user-789";
    mockError = true;

    await act(async () => {
      render(
        <UserTierProvider>
          <TestConsumer />
        </UserTierProvider>,
      );
    });

    expect(screen.getByTestId("tier").textContent).toBe("free");
    expect(screen.getByTestId("isAuth").textContent).toBe("true");
  });

  it("throws when used outside provider", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useUserTier must be used within a UserTierProvider",
    );

    spy.mockRestore();
  });
});
