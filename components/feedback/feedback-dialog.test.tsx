import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock shadcn Dialog to render children directly in jsdom
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

// Mock Radix Select — renders as native select for testing
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
  }) => (
    <div
      data-testid="select-root"
      onChange={(e: React.ChangeEvent<HTMLElement>) => {
        const target = e.target as HTMLSelectElement;
        onValueChange?.(target.value);
      }}
    >
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: { children: React.ReactNode; "aria-label"?: string }) => (
    <button type="button" {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { FeedbackDialog } from "./feedback-dialog";
import { toast } from "sonner";

describe("FeedbackDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
  });

  it("renders nothing when closed", () => {
    render(<FeedbackDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("renders dialog title when open", () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("title")).toBeDefined();
  });

  it("renders category select", () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("categoryPlaceholder")).toBeDefined();
  });

  it("renders description textarea", () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("messagePlaceholder");
    expect(textarea).toBeDefined();
  });

  it("renders email opt-in checkbox", () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("includeEmail")).toBeDefined();
  });

  it("renders submit button", () => {
    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("submit")).toBeDefined();
  });

  it("submits feedback and shows success toast", async () => {
    const onOpenChange = vi.fn();
    render(<FeedbackDialog open={true} onOpenChange={onOpenChange} />);

    // Fill textarea
    const textarea = screen.getByPlaceholderText("messagePlaceholder");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed bug report for testing" },
    });

    // Submit
    const submitBtn = screen.getByText("submit");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("shows error toast on API failure", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "githubError" }), { status: 500 }),
    );

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("messagePlaceholder");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed bug report for testing" },
    });

    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
    });
  });

  it("shows rate limited toast on 429", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "rateLimited" }), { status: 429 }),
    );

    render(<FeedbackDialog open={true} onOpenChange={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("messagePlaceholder");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed bug report for testing" },
    });

    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("rateLimited");
    });
  });
});
