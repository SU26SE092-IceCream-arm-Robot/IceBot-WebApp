import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductTemplates } from "@/hooks/use-product-templates";
import { cloneProductTemplate } from "@/lib/services/menu-management";
import type { ProductResult } from "@/types/menu-management";

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/lib/services/menu-management", () => ({
  cloneProductTemplate: vi.fn(),
  getMenuManagementErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể cập nhật dữ liệu.") => fallback,
  ),
  listProductTemplates: vi.fn(),
}));

const template = {
  id: "template-1",
  name: "Kem mẫu",
  displayName: "Kem mẫu",
} as ProductResult;

const clonedProduct = {
  id: "product-1",
  name: "Kem đã tạo",
  displayName: "Kem đã tạo",
} as ProductResult;

describe("useProductTemplates clone refresh recovery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps clone success and retries only the refresh when the list reload fails", async () => {
    vi.mocked(cloneProductTemplate).mockResolvedValue(clonedProduct);
    const onCloned = vi.fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useProductTemplates({
      organizationId: "organization-1",
      onCloned,
    }));

    await act(async () => {
      await result.current.cloneTemplate(template);
    });

    expect(cloneProductTemplate).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Đã tạo sản phẩm Kem đã tạo từ mẫu.");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).toContain("đã được tạo");

    await act(async () => {
      await result.current.retryRefresh();
    });

    expect(cloneProductTemplate).toHaveBeenCalledOnce();
    expect(onCloned).toHaveBeenCalledTimes(2);
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("keeps a clone failure separate from refresh recovery", async () => {
    vi.mocked(cloneProductTemplate).mockRejectedValueOnce(new Error("mutation failed"));
    const onCloned = vi.fn();
    const { result } = renderHook(() => useProductTemplates({
      organizationId: "organization-1",
      onCloned,
    }));

    await act(async () => {
      await result.current.cloneTemplate(template);
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(onCloned).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe("sản phẩm từ mẫu");
    expect(result.current.refreshWarningMessage).toBeNull();
  });
});
