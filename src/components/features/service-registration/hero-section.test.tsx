import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "@/components/features/service-registration/hero-section";

describe("HeroSection", () => {
  it("has one page heading and keeps both CTA destinations", () => {
    render(<HeroSection />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("FaiRobot Studio sắp phát hành")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Xem hành trình triển khai" })).toHaveAttribute(
      "href",
      "#cach-hoat-dong",
    );
  });

  it("renders system-map labels without requiring motion", () => {
    render(<HeroSection />);

    expect(screen.getByText("FaiRobot Studio")).toBeVisible();
    expect(screen.getByText("Workflow file")).toBeVisible();
    expect(screen.getByText("Order & payment")).toBeVisible();
    expect(screen.getByText("Edge & robot")).toBeVisible();
    expect(screen.getByText("IceBot Core")).toBeVisible();
  });
});
