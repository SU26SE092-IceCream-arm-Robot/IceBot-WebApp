import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductionWorkspaceView } from "@/components/features/production/production-workspace-view";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ effectiveAccess: null }),
}));

vi.mock("@/hooks/use-production-organization-scope", () => ({
  useProductionOrganizationScope: () => ({
    organizations: [],
    selectedOrganizationId: null,
    setSelectedOrganizationId: vi.fn(),
    isLoading: false,
    errorMessage: null,
    refresh: vi.fn(),
  }),
}));

describe("ProductionWorkspaceView", () => {
  it("keeps import unavailable until an organization is selected", () => {
    render(<ProductionWorkspaceView />);

    expect(screen.getByText("Bước 1: Chọn tổ chức")).toBeInTheDocument();
    expect(screen.getByText("Tài khoản hiện tại chưa có tổ chức nào trong phạm vi cấu hình sản xuất.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Chọn bundle Fairino định dạng ZIP")).not.toBeInTheDocument();
  });
});
