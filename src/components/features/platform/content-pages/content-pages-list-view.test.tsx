import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContentPagesListView } from "@/components/features/platform/content-pages/content-pages-list-view";
import { useAuth } from "@/hooks/identity/use-auth";
import { useContentPages } from "@/hooks/platform/use-content-pages";
import type { EffectiveAccessResult } from "@/types/identity/accounts";

vi.mock("@/hooks/identity/use-auth");
vi.mock("@/hooks/platform/use-content-pages");

describe("ContentPagesListView", () => {
  it("renders static content pages table with 5 predefined items", () => {
    vi.mocked(useAuth).mockReturnValue({
      effectiveAccess: {
        isSystemAdmin: true,
        roles: ["SystemAdmin"],
        permissionCodes: ["content-pages.read", "content-pages.manage"],
        roleScopes: [],
      } as unknown as EffectiveAccessResult,
      status: "authenticated",
      session: null,
      currentUser: null,
      errorMessage: null,
      retryRestore: vi.fn(),
      login: vi.fn(),
      googleLogin: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(useContentPages).mockReturnValue({
      items: [
        {
          id: "1",
          key: "privacy-policy",
          slug: "privacy-policy",
          draftTitle: "Chính sách bảo mật",
          draftBodyHtml: "<p>Nội dung</p>",
          publishedRevisionId: "rev-1",
          revision: 1,
        },
      ],
      isLoading: false,
      isMutating: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<ContentPagesListView />);

    expect(
      screen.getByRole("heading", { name: /Quản lý trang nội dung tĩnh/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Chính sách bảo mật").length).toBeGreaterThan(0);
    expect(screen.getByText("/privacy-policy")).toBeInTheDocument();
    expect(screen.getByText(/Đã xuất bản/i)).toBeInTheDocument();
  });
});
