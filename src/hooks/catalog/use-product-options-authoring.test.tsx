import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductOptionsAuthoring } from "@/hooks/catalog/use-product-options-authoring";
import { createOptionGroup } from "@/lib/services/catalog/menu-management";

vi.mock("@/lib/services/catalog/menu-management", () => ({
  createOptionGroup: vi.fn(),
  createProductOption: vi.fn(),
  deleteOptionGroup: vi.fn(),
  deleteProductOption: vi.fn(),
  replaceProductOptionIngredientRequirements: vi.fn(),
  setOptionGroupStatus: vi.fn(),
  setProductOptionAvailability: vi.fn(),
  updateOptionGroup: vi.fn(),
  updateProductOption: vi.fn(),
  getMenuManagementErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Không thể cập nhật tùy chọn.",
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn() },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const request = {
  code: "SIZE",
  name: "Kích cỡ",
  selectionType: "Single" as const,
  minSelections: 1,
  maxSelections: 1,
  isRequired: true,
  displayOrder: 1,
};

describe("useProductOptionsAuthoring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("guards duplicate mutations and refreshes only after success", async () => {
    const pending = deferred<unknown>();
    vi.mocked(createOptionGroup).mockReturnValue(pending.promise as never);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useProductOptionsAuthoring({
        organizationId: "org-1",
        productId: "product-1",
        onChanged,
      }),
    );

    let first!: Promise<boolean>;
    act(() => {
      first = result.current.createGroup(request);
    });
    await act(async () => {
      expect(await result.current.createGroup(request)).toBe(false);
    });
    expect(createOptionGroup).toHaveBeenCalledOnce();

    pending.resolve({});
    await act(async () => {
      expect(await first).toBe(true);
    });
    expect(onChanged).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("keeps a backend conflict as mutation error without refreshing", async () => {
    vi.mocked(createOptionGroup).mockRejectedValue(
      new Error("Mã nhóm tùy chọn đã tồn tại."),
    );
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useProductOptionsAuthoring({
        organizationId: "org-1",
        productId: "product-1",
        onChanged,
      }),
    );

    await act(async () => {
      expect(await result.current.createGroup(request)).toBe(false);
    });

    expect(result.current.errorMessage).toBe("Mã nhóm tùy chọn đã tồn tại.");
    expect(onChanged).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
