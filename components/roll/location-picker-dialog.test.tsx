import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("./location-map", () => ({
  default: ({
    lat,
    lon,
    onMarkerMove,
  }: {
    lat: number;
    lon: number;
    onMarkerMove: (lat: number, lon: number) => void;
  }) => (
    <div data-testid="mock-map" data-lat={lat} data-lon={lon}>
      <button
        data-testid="mock-map-click"
        onClick={() => onMarkerMove(48.8566, 2.3522)}
      />
    </div>
  ),
}));

import { LocationPickerDialog } from "./location-picker-dialog";

describe("LocationPickerDialog", () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  const onClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders dialog title when open", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("location.title")).toBeDefined();
  });

  it("shows coordinates from initialLat/initialLon in manual inputs", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={40.7128}
        initialLon={-74.006}
        onConfirm={onConfirm}
      />,
    );
    const latInput = screen.getByLabelText("location.latitude") as HTMLInputElement;
    const lonInput = screen.getByLabelText("location.longitude") as HTMLInputElement;
    expect(latInput.value).toBe("40.7128");
    expect(lonInput.value).toBe("-74.006");
  });

  it("search input is disabled when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    const searchInput = screen.getByLabelText("location.search") as HTMLInputElement;
    expect(searchInput.disabled).toBe(true);
    expect(screen.getByText("location.offlineBanner")).toBeDefined();
  });

  it("confirm button calls onConfirm with correct lat/lon/name", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={40.7128}
        initialLon={-74.006}
        initialName="New York"
        onConfirm={onConfirm}
      />,
    );
    const confirmBtn = screen.getByText("location.update");
    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith(40.7128, -74.006, "New York");
  });

  it("onClear is called by the remove button", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={40.7128}
        initialLon={-74.006}
        onConfirm={onConfirm}
        onClear={onClear}
      />,
    );
    const removeBtn = screen.getByText("location.remove");
    await userEvent.click(removeBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("does not show remove button when no initial location", () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        onClear={onClear}
      />,
    );
    expect(screen.queryByText("location.remove")).toBeNull();
  });

  it("updates coordinates when map marker is moved", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={51.505}
        initialLon={-0.09}
        onConfirm={onConfirm}
      />,
    );

    // Wait for map to load (async dynamic import)
    await waitFor(() => {
      expect(screen.getByTestId("mock-map")).toBeDefined();
    });

    // Simulate map click via the mock
    const mockClick = screen.getByTestId("mock-map-click");
    await userEvent.click(mockClick);

    const latInput = screen.getByLabelText("location.latitude") as HTMLInputElement;
    expect(latInput.value).toBe("48.8566");

    // Confirm with updated coords
    const confirmBtn = screen.getByText("location.update");
    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith(48.8566, 2.3522, "");
  });

  it("shows update button text when editing existing location", () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={40.7128}
        initialLon={-74.006}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("location.update")).toBeDefined();
    expect(screen.queryByText("location.set")).toBeNull();
  });

  it("passes lat/lon to map component", async () => {
    render(
      <LocationPickerDialog
        open={true}
        onOpenChange={onOpenChange}
        initialLat={35.6762}
        initialLon={139.6503}
        onConfirm={onConfirm}
      />,
    );

    await waitFor(() => {
      const map = screen.getByTestId("mock-map");
      expect(map.dataset.lat).toBe("35.6762");
      expect(map.dataset.lon).toBe("139.6503");
    });
  });
});
