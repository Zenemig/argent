import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/app/(auth)/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("@/components/logo", () => ({
  LogoIcon: () => <div data-testid="logo-icon" />,
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders login mode by default with email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: "login" })).toBeDefined();
    expect(screen.getByLabelText("email")).toBeDefined();
    expect(screen.getByLabelText("password")).toBeDefined();
  });

  it("switches to signup mode", () => {
    render(<LoginForm />);
    // Click the signup link (inside the "dontHaveAccount" paragraph)
    const signupButton = screen.getAllByText("signup").find(
      (el) => el.tagName === "BUTTON",
    );
    fireEvent.click(signupButton!);
    expect(screen.getByRole("heading", { name: "signup" })).toBeDefined();
    expect(screen.getByText("createAccount")).toBeDefined();
  });

  it("switches to reset mode and hides password field", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText("forgotPassword"));
    expect(
      screen.getByRole("heading", { name: "resetPassword" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("password")).toBeNull();
  });

  it("can go back to login from reset mode", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText("forgotPassword"));
    fireEvent.click(screen.getByText("backToLogin"));
    expect(screen.getByRole("heading", { name: "login" })).toBeDefined();
    expect(screen.getByLabelText("password")).toBeDefined();
  });

  it("can go back to login from signup mode", () => {
    render(<LoginForm />);
    const signupButton = screen.getAllByText("signup").find(
      (el) => el.tagName === "BUTTON",
    );
    fireEvent.click(signupButton!);
    const loginButton = screen.getAllByText("login").find(
      (el) => el.tagName === "BUTTON",
    );
    fireEvent.click(loginButton!);
    expect(screen.getByRole("heading", { name: "login" })).toBeDefined();
  });
});
