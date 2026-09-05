import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicContentPageView } from "@/components/features/content-pages/public-content-page-view";
import { getPublicContentPage } from "@/lib/services/platform/content-pages";

vi.mock("@/lib/services/platform/content-pages");

describe("PublicContentPageView", () => {
  beforeEach(() => vi.clearAllMocks());
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

    vi.mocked(getPublicContentPage).mockResolvedValueOnce({
      slug: "privacy-policy",
      title: "Chính sách bảo mật",
      bodyHtml: "<p>Nội dung đã tải lại.</p>",
      publishedAt: null,
      revisionNumber: 1,
    });
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Nội dung đã tải lại.")).toBeInTheDocument();
    expect(getPublicContentPage).toHaveBeenCalledTimes(2);
  });
});
