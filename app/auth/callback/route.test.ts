import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExchangeCode, mockGetUser, mockUpdateUser, mockSendWelcome } =
  vi.hoisted(() => ({
    mockExchangeCode: vi.fn(),
    mockGetUser: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockSendWelcome: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) =>
          mockExchangeCode(...args),
        getUser: () => mockGetUser(),
        updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      },
    }),
}));

vi.mock("@/lib/email/send-welcome", () => ({
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcome(...args),
}));

vi.mock("@/lib/analytics/track-event.server", () => ({
  trackEventServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
    }),
}));

const { GET } = await import("./route");

function makeRequest(code?: string, type?: string) {
  const params = new URLSearchParams();
  if (code) params.set("code", code);
  if (type) params.set("type", type);
  const qs = params.toString();
  const url = `http://localhost:3000/auth/callback${qs ? `?${qs}` : ""}`;
  return new Request(url);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mockExchangeCode.mockReset();
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockSendWelcome.mockReset();
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("exchanges code and redirects to / on success", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.com",
          user_metadata: { welcome_email_sent: true },
        },
      },
    });

    const response = await GET(makeRequest("test-code-123"));

    expect(mockExchangeCode).toHaveBeenCalledWith("test-code-123");
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it("redirects to /login when exchange fails", async () => {
    mockExchangeCode.mockResolvedValue({
      error: { message: "Invalid code" },
    });

    const response = await GET(makeRequest("bad-code"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/login",
    );
  });

  it("redirects to /login when no code param", async () => {
    const response = await GET(makeRequest());

    expect(mockExchangeCode).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/login",
    );
  });

  it("sends welcome email when welcome_email_sent is not set", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "new@example.com",
          user_metadata: { locale: "es" },
        },
      },
    });
    mockSendWelcome.mockResolvedValue(undefined);

    await GET(makeRequest("first-login-code"));

    expect(mockSendWelcome).toHaveBeenCalledWith({
      email: "new@example.com",
      locale: "es",
    });
  });

  it("marks welcome_email_sent after sending", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "new@example.com",
          user_metadata: {},
        },
      },
    });
    mockSendWelcome.mockResolvedValue(undefined);

    await GET(makeRequest("code"));

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { welcome_email_sent: true },
    });
  });

  it("does not send welcome email when already sent", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "existing@example.com",
          user_metadata: { welcome_email_sent: true },
        },
      },
    });

    await GET(makeRequest("returning-code"));

    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("does not block redirect if welcome email fails", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.com",
          user_metadata: {},
        },
      },
    });
    mockSendWelcome.mockRejectedValue(new Error("Resend down"));

    const response = await GET(makeRequest("code"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it("defaults locale to en when not in user metadata", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.com",
          user_metadata: {},
        },
      },
    });
    mockSendWelcome.mockResolvedValue(undefined);

    await GET(makeRequest("code"));

    expect(mockSendWelcome).toHaveBeenCalledWith({
      email: "user@example.com",
      locale: "en",
    });
  });

  it("redirects to /reset-password for recovery type", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.com",
          user_metadata: { welcome_email_sent: true },
        },
      },
    });

    const response = await GET(makeRequest("recovery-code", "recovery"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/reset-password",
    );
  });

  it("does not send welcome email for recovery flow", async () => {
    mockExchangeCode.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: "user@example.com",
          user_metadata: {},
        },
      },
    });

    await GET(makeRequest("recovery-code", "recovery"));

    expect(mockSendWelcome).not.toHaveBeenCalled();
  });
});
