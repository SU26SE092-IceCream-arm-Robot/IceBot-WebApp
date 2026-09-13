import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicHeader } from "@/components/features/service-registration/public-header";

describe("PublicHeader", () => {
  it("keeps public destinations and exposes mobile menu state", () => {
    render(<PublicHeader />);

    expect(screen.getByRole("link", { name: "ICEBOT" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getAllByRole("link", { name: "Đăng nhập quản trị" })[0],
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getAllByRole("link", { name: "Trao đổi mô hình triển khai" })[0],
    ).toHaveAttribute("href", "#dang-ky");

    const menuButton = screen.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", {
        name: "Điều hướng trên thiết bị di động",
      }),
    ).toBeVisible();
  });

  it("closes the mobile menu on Escape and restores focus to its trigger", async () => {
    render(<PublicHeader />);

    const menuButton = screen.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    fireEvent.click(menuButton);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("navigation", {
          name: "Điều hướng trên thiết bị di động",
        }),
      ).not.toBeInTheDocument();
      expect(menuButton).toHaveFocus();
    });
  });

  it("closes the mobile menu after navigating to an anchor", () => {
    render(<PublicHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Mở menu điều hướng" }));
    fireEvent.click(
      within(
        screen.getByRole("navigation", {
          name: "Điều hướng trên thiết bị di động",
        }),
      ).getByRole("link", { name: "Giải pháp" }),
    );

    expect(
      screen.queryByRole("navigation", {
        name: "Điều hướng trên thiết bị di động",
      }),
    ).not.toBeInTheDocument();
  });

  it("qualifies landing anchors when rendered outside the landing page", () => {
    render(<PublicHeader rootQualifiedAnchors />);

    expect(
      screen.getAllByRole("link", { name: "Giải pháp" })[0],
    ).toHaveAttribute("href", "/#giai-phap");
    expect(
      screen.getAllByRole("link", { name: "Trao đổi mô hình triển khai" })[0],
    ).toHaveAttribute("href", "/#dang-ky");
  });
});
