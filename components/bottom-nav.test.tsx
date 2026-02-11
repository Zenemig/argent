import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

import { BottomNav } from "./bottom-nav";

describe("BottomNav", () => {
  it("renders all four navigation items", () => {
    render(<BottomNav />);
    expect(screen.getByText("dashboard")).toBeDefined();
    expect(screen.getByText("gear")).toBeDefined();
    expect(screen.getByText("stats")).toBeDefined();
    expect(screen.getByText("settings")).toBeDefined();
  });

  it("renders links to correct paths", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/gear");
    expect(hrefs).toContain("/stats");
    expect(hrefs).toContain("/settings");
  });

  it("highlights the active item based on pathname", () => {
    mockPathname = "/gear";
    render(<BottomNav />);
    const gearLink = screen.getByText("gear").closest("a");
    expect(gearLink?.className).toContain("text-primary");
  });
});
