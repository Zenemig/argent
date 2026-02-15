import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockUserEmail: string | null = "test@example.com";
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: mockUserEmail ? { email: mockUserEmail } : null },
        }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

const mockDbDelete = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/db", () => ({
  db: { delete: () => mockDbDelete() },
}));

// Radix AlertDialog doesn't render portal content in jsdom — mock with simple divs
vi.mock("@/components/ui/alert-dialog", () => {
  const React = require("react");
  return {
    AlertDialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) =>
      React.createElement("div", { "data-testid": "alert-dialog", "data-open": open, onClick: () => onOpenChange?.(!open) }, children),
    AlertDialogTrigger: ({ children, ...props }: { children: React.ReactNode; asChild?: boolean }) =>
      React.createElement("div", { "data-testid": "alert-dialog-trigger", ...props }, children),
    AlertDialogContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "alert-dialog-content" }, children),
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    AlertDialogTitle: ({ children }: { children: React.ReactNode }) =>
      React.createElement("h2", null, children),
    AlertDialogDescription: ({ children }: { children: React.ReactNode }) =>
      React.createElement("p", null, children),
    AlertDialogCancel: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement("button", props, children),
    AlertDialogAction: ({ children, ...props }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) =>
      React.createElement("button", props, children),
  };
});

vi.mock("@/components/ui/button", () => {
  const React = require("react");
  return {
    Button: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement("button", props, children),
  };
});

vi.mock("@/components/ui/input", () => {
  const React = require("react");
  return {
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
      React.createElement("input", props),
  };
});

vi.mock("@/components/ui/label", () => {
  const React = require("react");
  return {
    Label: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement("label", props, children),
  };
});

import { DeleteAccountSection } from "./delete-account-section";
import { toast } from "sonner";

describe("DeleteAccountSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserEmail = "test@example.com";
    mockDbDelete.mockResolvedValue(undefined);
    mockPush.mockClear();
    global.fetch = vi.fn();
    global.localStorage.clear();
  });

  it("renders delete account button", async () => {
    render(<DeleteAccountSection />);
    expect(screen.getByText("deleteAccountButton")).toBeDefined();
  });

  it("renders description text", () => {
    render(<DeleteAccountSection />);
    expect(screen.getByText("deleteAccountDescription")).toBeDefined();
  });

  it("renders confirmation dialog title", () => {
    render(<DeleteAccountSection />);
    expect(screen.getByText("deleteAccountConfirmTitle")).toBeDefined();
  });

  it("renders confirmation input label", () => {
    render(<DeleteAccountSection />);
    expect(screen.getByText("deleteAccountConfirmLabel")).toBeDefined();
  });

  it("disables confirm button when input does not match email", () => {
    render(<DeleteAccountSection />);
    const confirmBtn = screen.getByText("deleteAccount");
    expect(confirmBtn).toHaveProperty("disabled", true);
  });

  it("enables confirm button when input matches email", async () => {
    render(<DeleteAccountSection />);

    const input = screen.getByPlaceholderText("deleteAccountConfirmPlaceholder");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    await waitFor(() => {
      const confirmBtn = screen.getByText("deleteAccount");
      expect(confirmBtn).toHaveProperty("disabled", false);
    });
  });

  it("calls API and cleans up on successful deletion", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<DeleteAccountSection />);

    const input = screen.getByPlaceholderText("deleteAccountConfirmPlaceholder");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    await waitFor(() => {
      const confirmBtn = screen.getByText("deleteAccount");
      expect(confirmBtn).toHaveProperty("disabled", false);
    });

    const confirmBtn = screen.getByText("deleteAccount");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "test@example.com" }),
      });
    });

    await waitFor(() => {
      expect(mockDbDelete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error toast when API returns error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "deletionFailed" }),
    });

    render(<DeleteAccountSection />);

    const input = screen.getByPlaceholderText("deleteAccountConfirmPlaceholder");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    await waitFor(() => {
      const confirmBtn = screen.getByText("deleteAccount");
      expect(confirmBtn).toHaveProperty("disabled", false);
    });

    const confirmBtn = screen.getByText("deleteAccount");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("deleteAccountError");
    });
  });
});
