import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicContentPageView } from "@/components/features/content-pages/public-content-page-view";
import { getPublicContentPage } from "@/lib/services/platform/content-pages";

vi.mock("@/lib/services/platform/content-pages");

describe("PublicContentPageView", () => {
  it("renders published content title and body HTML for public visitors", async () => {
    vi.mocked(getPublicContentPage).mockResolvedValue({
      slug: "about-us",
      title: "Về chúng tôi - IceBot",
      bodyHtml: "<p>IceBot là hệ thống bán kem thông minh.</p>",
      publishedAt: "2026-08-17T00:00:00Z",
      revisionNumber: 2,
    });

    render(<PublicContentPageView slug="about-us" />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Về chúng tôi - IceBot" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("IceBot là hệ thống bán kem thông minh."),
    ).toBeInTheDocument();
    expect(screen.getByText("Phiên bản: v2")).toBeInTheDocument();
  });

  it("shows fallback message when page has no published revision", async () => {
    vi.mocked(getPublicContentPage).mockRejectedValue(
      new Error("Trang chưa được xuất bản."),
    );

    render(<PublicContentPageView slug="privacy-policy" />);

    await waitFor(() => {
      expect(
        screen.getByText("Nội dung đang được cập nhật"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: "Quay về Trang chủ" }),
    ).toBeInTheDocument();
  });
});
