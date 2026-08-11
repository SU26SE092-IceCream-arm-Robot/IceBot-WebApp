import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductionWorkspaceView } from "@/components/features/production/production-workspace-view";

vi.mock("@/hooks/identity/use-auth", () => ({
  useAuth: () => ({ effectiveAccess: null }),
}));

vi.mock("@/hooks/production/use-production-organization-scope", () => ({
  useProductionOrganizationScope: () => ({
    organizations: [],
    selectedOrganization: null,
    selectedOrganizationId: null,
    search: "",
    setSearch: vi.fn(),
    pageNumber: 1,
    setPageNumber: vi.fn(),
    pagination: {
      page: 1,
      pageSize: 25,
      totalCount: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    },
    selectOrganization: vi.fn(),
    isLoading: false,
    errorMessage: null,
    refresh: vi.fn(),
  }),
}));

describe("ProductionWorkspaceView", () => {
  it("keeps import unavailable until an organization is selected", () => {
    render(<ProductionWorkspaceView />);

    expect(
      screen.getByText("Chọn tổ chức", {
        selector: '[data-slot="card-title"]',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xem luồng" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tài khoản hiện tại chưa có tổ chức nào trong phạm vi cấu hình sản xuất.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Chọn bundle Fairino định dạng ZIP")).not.toBeInTheDocument();
  });
});
