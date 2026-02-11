import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("@/lib/settings-helpers", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
}));

import { ExportDialog } from "./xmp-export-dialog";

describe("ExportDialog", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with xmp title when open", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("xmp")).toBeDefined();
  });

  it("renders dialog with csv title", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="csv"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("csv")).toBeDefined();
  });

  it("renders filename pattern tab", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getAllByText("filenamePattern").length).toBeGreaterThanOrEqual(1);
  });

  it("renders file list tab", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("fileList")).toBeDefined();
  });

  it("renders pattern input with default value", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    const input = screen.getByDisplayValue("scan_{frame_number}.tif") as HTMLInputElement;
    expect(input).toBeDefined();
  });

  it("renders preview section", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("preview")).toBeDefined();
  });

  it("renders download and cancel buttons", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("download")).toBeDefined();
    expect(screen.getByText("cancel")).toBeDefined();
  });

  it("shows pattern hint description", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("patternHint")).toBeDefined();
  });
});
