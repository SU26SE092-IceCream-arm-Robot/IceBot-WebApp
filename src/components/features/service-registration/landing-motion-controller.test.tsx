import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const gsapMocks = vi.hoisted(() => {
  const add = vi.fn();
  const revert = vi.fn();

  return {
    add,
    matchMedia: vi.fn(() => ({ add, revert })),
    registerPlugin: vi.fn(),
    revert,
  };
});

vi.mock("gsap", () => ({
  default: {
    matchMedia: gsapMocks.matchMedia,
    registerPlugin: gsapMocks.registerPlugin,
  },
}));

import {
  LANDING_MOTION_QUERIES,
  LandingMotionController,
} from "@/components/features/service-registration/landing-motion-controller";

describe("LandingMotionController", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cleans up its matchMedia context after unmount", () => {
    const { unmount } = render(
      <LandingMotionController>
        <p>Landing content</p>
      </LandingMotionController>,
    );

    expect(gsapMocks.matchMedia).toHaveBeenCalledTimes(1);
    expect(gsapMocks.add).toHaveBeenCalledWith(LANDING_MOTION_QUERIES.desktop, expect.any(Function));
    expect(gsapMocks.add).toHaveBeenCalledWith(LANDING_MOTION_QUERIES.mobile, expect.any(Function));
    expect(gsapMocks.add).toHaveBeenCalledWith(LANDING_MOTION_QUERIES.reducedMotion, expect.any(Function));

    unmount();

    expect(gsapMocks.revert).toHaveBeenCalledTimes(1);
  });

  it("keeps content visible when reduced motion is preferred", () => {
    render(
      <LandingMotionController>
        <p data-testid="landing-content">Landing content</p>
      </LandingMotionController>,
    );

    const content = screen.getByTestId("landing-content");

    expect(content).toBeVisible();
    expect(content).not.toHaveStyle({ opacity: "0", transform: "translateY(20px)" });
  });
});
