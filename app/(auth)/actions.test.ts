import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- mocks ----------

const mockSignInWithPassword = vi.fn();
const mockSignUpAuth = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "origin" ? "http://localhost:3000" : null,
    }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: (...args: unknown[]) =>
          mockSignInWithPassword(...args),
        signUp: (...args: unknown[]) => mockSignUpAuth(...args),
        resetPasswordForEmail: (...args: unknown[]) =>
          mockResetPasswordForEmail(...args),
      },
    }),
}));

const { signIn, signUp, resetPassword } = await import("./actions");

// ---------- helpers ----------

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

// ---------- signIn ----------

describe("signIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invalidEmail for malformed email", async () => {
    const result = await signIn(fd({ email: "not-email", password: "123456" }));
    expect(result).toEqual({ error: "invalidEmail" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns passwordTooShort for < 6 chars", async () => {
    const result = await signIn(fd({ email: "a@b.com", password: "12345" }));
    expect(result).toEqual({ error: "passwordTooShort" });
  });

  it("returns invalidCredentials when Supabase rejects", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login" },
    });
    const result = await signIn(fd({ email: "a@b.com", password: "123456" }));
    expect(result).toEqual({ error: "invalidCredentials" });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("redirects to / on success", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signIn(fd({ email: "a@b.com", password: "123456" }));
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to next param when valid", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signIn(fd({ email: "a@b.com", password: "123456", next: "/gear" }));
    expect(mockRedirect).toHaveBeenCalledWith("/gear");
  });

  it("ignores next param with protocol-relative URL", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signIn(fd({ email: "a@b.com", password: "123456", next: "//evil.com" }));
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("ignores next param with absolute URL", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signIn(fd({ email: "a@b.com", password: "123456", next: "https://evil.com" }));
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("ignores next param with backslash", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signIn(fd({ email: "a@b.com", password: "123456", next: "/\\evil.com" }));
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});

// ---------- signUp ----------

describe("signUp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invalidEmail for malformed email", async () => {
    const result = await signUp(fd({ email: "bad", password: "123456" }));
    expect(result).toEqual({ error: "invalidEmail" });
    expect(mockSignUpAuth).not.toHaveBeenCalled();
  });

  it("returns passwordTooShort for < 6 chars", async () => {
    const result = await signUp(fd({ email: "a@b.com", password: "short" }));
    expect(result).toEqual({ error: "passwordTooShort" });
  });

  it("passes emailRedirectTo with origin", async () => {
    mockSignUpAuth.mockResolvedValue({ error: null });
    await signUp(fd({ email: "a@b.com", password: "123456" }));
    expect(mockSignUpAuth).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
      options: { emailRedirectTo: "http://localhost:3000/auth/callback" },
    });
  });

  it("returns confirmationSent on success", async () => {
    mockSignUpAuth.mockResolvedValue({ error: null });
    const result = await signUp(fd({ email: "a@b.com", password: "123456" }));
    expect(result).toEqual({ success: "confirmationSent" });
  });

  it("returns signupFailed on Supabase error", async () => {
    mockSignUpAuth.mockResolvedValue({
      error: { message: "Email taken" },
    });
    const result = await signUp(fd({ email: "a@b.com", password: "123456" }));
    expect(result).toEqual({ error: "signupFailed" });
  });
});

// ---------- resetPassword ----------

describe("resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invalidEmail for malformed email", async () => {
    const result = await resetPassword(fd({ email: "nope" }));
    expect(result).toEqual({ error: "invalidEmail" });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("calls resetPasswordForEmail with origin redirect", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    await resetPassword(fd({ email: "a@b.com" }));
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("a@b.com", {
      redirectTo: "http://localhost:3000/auth/callback",
    });
  });

  it("returns resetSent on success", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const result = await resetPassword(fd({ email: "a@b.com" }));
    expect(result).toEqual({ success: "resetSent" });
  });

  it("returns resetFailed on Supabase error", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Rate limited" },
    });
    const result = await resetPassword(fd({ email: "a@b.com" }));
    expect(result).toEqual({ error: "resetFailed" });
  });
});
