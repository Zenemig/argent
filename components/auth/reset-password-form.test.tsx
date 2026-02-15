import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/app/(auth)/actions", () => ({
  updatePassword: vi.fn(),
}));

vi.mock("@/components/logo", () => ({
  LogoIcon: () => <div data-testid="logo-icon" />,
}));

vi.mock("@/components/auth/password-input", () => ({
  PasswordInput: (props: React.ComponentProps<"input">) => (
    <input {...props} type="password" />
  ),
}));

import { ResetPasswordForm } from "./reset-password-form";

describe("ResetPasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders heading with resetPassword key", () => {
    render(<ResetPasswordForm />);
    expect(
      screen.getByRole("heading", { name: "resetPassword" }),
    ).toBeDefined();
  });

  it("renders subtitle with chooseNewPassword key", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText("chooseNewPassword")).toBeDefined();
  });

  it("renders new password and confirm password fields", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText("newPassword")).toBeDefined();
    expect(screen.getByLabelText("confirmPassword")).toBeDefined();
  });

  it("renders submit button with resetPassword key", () => {
    render(<ResetPasswordForm />);
    expect(
      screen.getByRole("button", { name: /resetPassword/ }),
    ).toBeDefined();
  });

  it("renders the logo", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByTestId("logo-icon")).toBeDefined();
  });
});
