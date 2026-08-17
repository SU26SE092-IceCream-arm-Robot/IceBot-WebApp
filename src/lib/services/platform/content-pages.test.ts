import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  getManagementContentPage,
  getPublicContentPage,
  listManagementContentPages,
  publishContentPage,
  saveContentPageDraft,
} from "@/lib/services/platform/content-pages";
import type { ApiResult } from "@/types";
import type {
  ContentPageDetailResult,
  ContentPageResult,
  PublicContentPageResult,
} from "@/types/platform/content-pages";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

function mockResponse<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<ApiResult<T>>;
}

describe("Static Content Pages API Services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches public content page by slug", async () => {
    const mockPage: PublicContentPageResult = {
      slug: "privacy-policy",
      title: "Chính sách bảo mật",
      bodyHtml: "<p>Nội dung bảo mật</p>",
      revisionNumber: 1,
      publishedAt: "2026-08-17T00:00:00Z",
    };

    vi.mocked(axiosClient.get).mockResolvedValue(
      mockResponse({
        succeeded: true,
        statusCode: 200,
        data: mockPage,
      }),
    );

    const result = await getPublicContentPage("privacy-policy");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/content-pages/privacy-policy",
      { signal: undefined },
    );
    expect(result).toEqual(mockPage);
  });

  it("fetches public content page when backend returns direct DTO without envelope", async () => {
    const directMockPage: PublicContentPageResult = {
      slug: "terms-of-use",
      title: "Điều khoản sử dụng",
      bodyHtml: "<p>Nội dung điều khoản</p>",
      revisionNumber: 2,
      publishedAt: "2026-08-17T00:00:00Z",
    };

    vi.mocked(axiosClient.get).mockResolvedValue({
      data: directMockPage,
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: {} },
    } as AxiosResponse<PublicContentPageResult>);

    const result = await getPublicContentPage("terms-of-use");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/content-pages/terms-of-use",
      { signal: undefined },
    );
    expect(result).toEqual(directMockPage);
  });

  it("throws error when public page request fails", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      mockResponse({
        succeeded: false,
        statusCode: 404,
        message: "Trang không tồn tại",
      }),
    );

    await expect(getPublicContentPage("not-found")).rejects.toThrow(
      "Trang không tồn tại",
    );
  });

  it("lists management content pages for SystemAdmin", async () => {
    const mockList: ContentPageResult[] = [
      {
        id: "page-1",
        key: "about-us",
        slug: "about-us",
        draftTitle: "Giới thiệu IceBot",
        draftBodyHtml: "<p>IceBot</p>",
      },
    ];

    vi.mocked(axiosClient.get).mockResolvedValue(
      mockResponse({
        succeeded: true,
        statusCode: 200,
        data: mockList,
      }),
    );

    const result = await listManagementContentPages();

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/content-pages",
      { signal: undefined },
    );
    expect(result).toEqual(mockList);
  });

  it("fetches single management content page by key", async () => {
    const mockDetail: ContentPageDetailResult = {
      id: "page-1",
      key: "terms-of-use",
      slug: "terms-of-use",
      draftTitle: "Điều khoản sử dụng",
      draftBodyHtml: "<p>Điều khoản</p>",
      revisions: [],
    };

    vi.mocked(axiosClient.get).mockResolvedValue(
      mockResponse({
        succeeded: true,
        statusCode: 200,
        data: mockDetail,
      }),
    );

    const result = await getManagementContentPage("terms-of-use");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/content-pages/terms-of-use",
      { signal: undefined },
    );
    expect(result).toEqual(mockDetail);
  });

  it("saves content page draft successfully", async () => {
    const updatedPage: ContentPageResult = {
      id: "page-1",
      key: "privacy-policy",
      slug: "privacy-policy",
      draftTitle: "Chính sách bảo mật mới",
      draftBodyHtml: "<p>Nội dung mới</p>",
      revision: 2,
    };

    vi.mocked(axiosClient.put).mockResolvedValue(
      mockResponse({
        succeeded: true,
        statusCode: 200,
        data: updatedPage,
      }),
    );

    const result = await saveContentPageDraft("privacy-policy", {
      title: "  Chính sách bảo mật mới  ",
      bodyHtml: "<p>Nội dung mới</p>",
      expectedRevision: 1,
    });

    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/content-pages/privacy-policy/draft",
      {
        title: "Chính sách bảo mật mới",
        bodyHtml: "<p>Nội dung mới</p>",
        expectedRevision: 1,
      },
    );
    expect(result).toEqual(updatedPage);
  });

  it("publishes content page draft with payload", async () => {
    const publishedPage: ContentPageResult = {
      id: "page-1",
      key: "privacy-policy",
      slug: "privacy-policy",
      publishedRevisionId: "rev-1",
      revision: 2,
    };

    vi.mocked(axiosClient.post).mockResolvedValue(
      mockResponse({
        succeeded: true,
        statusCode: 200,
        data: publishedPage,
      }),
    );

    const result = await publishContentPage("privacy-policy", {
      expectedRevision: 1,
    });

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/content-pages/privacy-policy/publish",
      {
        expectedRevision: 1,
      },
    );
    expect(result).toEqual(publishedPage);
  });
});
