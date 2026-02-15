import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders as password type by default", () => {
    render(<PasswordInput id="pw" name="pw" />);
    const input = document.querySelector("input[name='pw']") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("toggles to text type when eye button is clicked", () => {
    render(<PasswordInput id="pw" name="pw" />);
    const toggle = screen.getByRole("button", { name: "showPassword" });
    fireEvent.click(toggle);
    const input = document.querySelector("input[name='pw']") as HTMLInputElement;
    expect(input.type).toBe("text");
  });

  it("toggles back to password type on second click", () => {
    render(<PasswordInput id="pw" name="pw" />);
    const toggle = screen.getByRole("button", { name: "showPassword" });
    fireEvent.click(toggle);
    const toggleHide = screen.getByRole("button", { name: "hidePassword" });
    fireEvent.click(toggleHide);
    const input = document.querySelector("input[name='pw']") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("has aria-label showPassword when hidden", () => {
    render(<PasswordInput id="pw" name="pw" />);
    expect(screen.getByRole("button", { name: "showPassword" })).toBeDefined();
  });

  it("has aria-label hidePassword when visible", () => {
    render(<PasswordInput id="pw" name="pw" />);
    fireEvent.click(screen.getByRole("button", { name: "showPassword" }));
    expect(screen.getByRole("button", { name: "hidePassword" })).toBeDefined();
  });

  it("passes through standard input props", () => {
    render(
      <PasswordInput id="pw" name="pw" required disabled placeholder="Enter" />,
    );
    const input = document.querySelector("input[name='pw']") as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe("Enter");
  });
});
