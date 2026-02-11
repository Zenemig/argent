import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// Mock IntersectionObserver
let observerCallback: IntersectionObserverCallback;

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
  takeRecords = (): IntersectionObserverEntry[] => [];
}

beforeEach(() => {
  vi.clearAllMocks();
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

import { Reveal } from "./reveal";

describe("Reveal", () => {
  it("renders children", () => {
    render(
      <Reveal>
        <span>Hello</span>
      </Reveal>,
    );
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("starts with opacity 0 and translated down", () => {
    const { container } = render(
      <Reveal>
        <span>Hidden</span>
      </Reveal>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");
    expect(wrapper.style.transform).toContain("translateY(24px)");
  });

  it("becomes visible when intersection is triggered", () => {
    const { container } = render(
      <Reveal>
        <span>Content</span>
      </Reveal>,
    );

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe("1");
    expect(wrapper.style.transform).toContain("translateY(0");
  });

  it("observes the element on mount", () => {
    render(
      <Reveal>
        <span>Test</span>
      </Reveal>,
    );
    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Reveal className="my-class">
        <span>Test</span>
      </Reveal>,
    );
    expect(container.firstElementChild?.className).toContain("my-class");
  });

  it("applies delay to transition", () => {
    const { container } = render(
      <Reveal delay={200}>
        <span>Delayed</span>
      </Reveal>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.transition).toContain("200ms");
  });
});
