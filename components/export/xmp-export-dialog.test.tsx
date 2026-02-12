import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  db: {
    rolls: { get: vi.fn() },
    frames: { where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ sortBy: vi.fn().mockResolvedValue([]) }) }) },
    cameras: { get: vi.fn() },
    films: { get: vi.fn() },
    filmStock: { get: vi.fn() },
    lenses: { bulkGet: vi.fn().mockResolvedValue([]) },
  },
}));

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

  it("renders export and cancel buttons", () => {
    render(
      <ExportDialog
        rollId="roll-001"
        frameCount={5}
        format="xmp"
        open={true}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText("export")).toBeDefined();
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

describe("deliverFile", () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("uses navigator.share when canShare returns true for files", async () => {
    const { deliverFile } = await import("./xmp-export-dialog");
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        share: mockShare,
        canShare: mockCanShare,
      },
      writable: true,
      configurable: true,
    });

    const blob = new Blob(["test"], { type: "text/plain" });
    await deliverFile(blob, "test.txt");

    expect(mockCanShare).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalledWith({
      files: [expect.any(File)],
    });
  });

  it("falls back to <a download> when canShare is not available", async () => {
    const { deliverFile } = await import("./xmp-export-dialog");

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        share: undefined,
        canShare: undefined,
      },
      writable: true,
      configurable: true,
    });

    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
      setAttribute: vi.fn(),
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const blob = new Blob(["test"], { type: "text/plain" });
    await deliverFile(blob, "test.txt");

    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it("falls back to <a download> when canShare returns false", async () => {
    const { deliverFile } = await import("./xmp-export-dialog");
    const mockCanShare = vi.fn().mockReturnValue(false);

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        canShare: mockCanShare,
        share: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
      setAttribute: vi.fn(),
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const blob = new Blob(["test"], { type: "text/plain" });
    await deliverFile(blob, "test.txt");

    expect(mockCanShare).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it("falls back to <a download> when share rejects", async () => {
    const { deliverFile } = await import("./xmp-export-dialog");
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockShare = vi.fn().mockRejectedValue(new Error("User cancelled"));

    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        canShare: mockCanShare,
        share: mockShare,
      },
      writable: true,
      configurable: true,
    });

    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
      setAttribute: vi.fn(),
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockReturnValue(null as unknown as Node);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const blob = new Blob(["test"], { type: "text/plain" });
    await deliverFile(blob, "test.txt");

    expect(mockShare).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});
