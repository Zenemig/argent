import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("./camera-catalog", () => ({
  CameraCatalog: () => <div data-testid="camera-catalog" />,
}));

vi.mock("./lens-catalog", () => ({
  LensCatalog: () => <div data-testid="lens-catalog" />,
}));

vi.mock("./film-catalog", () => ({
  FilmCatalog: () => <div data-testid="film-catalog" />,
}));

import { GearTabs } from "./gear-tabs";

describe("GearTabs", () => {
  it("renders three tab triggers", () => {
    render(<GearTabs />);
    expect(screen.getByText("cameras")).toBeDefined();
    expect(screen.getByText("lenses")).toBeDefined();
    expect(screen.getByText("films")).toBeDefined();
  });

  it("shows camera catalog by default", () => {
    render(<GearTabs />);
    expect(screen.getByTestId("camera-catalog")).toBeDefined();
  });
});
