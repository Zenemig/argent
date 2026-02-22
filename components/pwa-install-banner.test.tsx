import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// --- Mocks (before imports) ---

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

let mockIsPersisted: boolean | null = null;
vi.mock("@/components/db-provider", () => ({
  useStoragePersisted: () => mockIsPersisted,
}));

let mockIsProUser = false;
vi.mock("@/hooks/useUserTier", () => ({
  useUserTier: () => ({ isProUser: mockIsProUser }),
}));

import { PwaInstallBanner } from "./pwa-install-banner";

const DISMISS_KEY = "pwa-install-banner-dismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

describe("PwaInstallBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPersisted = false;
    mockIsProUser = false;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isPersisted is true", () => {
    mockIsPersisted = true;
    const { container } = render(<PwaInstallBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when isPersisted is null (loading)", () => {
    mockIsPersisted = null;
    const { container } = render(<PwaInstallBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render for Pro users even when isPersisted is false", () => {
    mockIsPersisted = false;
    mockIsProUser = true;
    const { container } = render(<PwaInstallBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("hides when Pro tier loads after initial render", () => {
    mockIsPersisted = false;
    mockIsProUser = false;
    const { rerender } = render(<PwaInstallBanner />);
    expect(screen.getByText("title")).toBeDefined();

    // Simulate tier loading: isProUser becomes true
    mockIsProUser = true;
    rerender(<PwaInstallBanner />);
    expect(screen.queryByText("title")).toBeNull();
  });

  it("renders warning when isPersisted is false", () => {
    mockIsPersisted = false;
    render(<PwaInstallBanner />);
    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("description")).toBeDefined();
  });

  it("shows Install App button when beforeinstallprompt fires", () => {
    render(<PwaInstallBanner />);

    // Initially no install button
    expect(screen.queryByRole("button", { name: "installAction" })).toBeNull();

    // Fire beforeinstallprompt
    const promptEvent = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
    };
    Object.assign(promptEvent, {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    expect(screen.getByRole("button", { name: "installAction" })).toBeDefined();
  });

  it("calls prompt() when Install App is clicked", async () => {
    render(<PwaInstallBanner />);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const promptEvent = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
    };
    Object.assign(promptEvent, {
      preventDefault: vi.fn(),
      prompt: promptMock,
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    fireEvent.click(screen.getByRole("button", { name: "installAction" }));
    expect(promptMock).toHaveBeenCalled();
  });

  it("hides Install App button when beforeinstallprompt is not available", () => {
    render(<PwaInstallBanner />);
    expect(screen.queryByRole("button", { name: "installAction" })).toBeNull();
  });

  it("dismiss button hides banner and stores timestamp in localStorage", () => {
    render(<PwaInstallBanner />);
    expect(screen.getByText("title")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "dismiss" }));

    expect(screen.queryByText("title")).toBeNull();
    expect(localStorage.getItem(DISMISS_KEY)).toBeTruthy();
  });

  it("does not render when dismissed within 7 days", () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    const { container } = render(<PwaInstallBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("re-renders after 7-day dismissal period expires", () => {
    const eightDaysAgo = Date.now() - SEVEN_DAYS_MS - 1000;
    localStorage.setItem(DISMISS_KEY, String(eightDaysAgo));
    render(<PwaInstallBanner />);
    expect(screen.getByText("title")).toBeDefined();
  });

  it("hides after appinstalled event fires", () => {
    render(<PwaInstallBanner />);
    expect(screen.getByText("title")).toBeDefined();

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(screen.queryByText("title")).toBeNull();
  });
});
