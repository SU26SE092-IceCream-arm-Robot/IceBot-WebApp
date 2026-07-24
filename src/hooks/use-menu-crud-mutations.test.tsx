import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMenuCrud } from "@/hooks/use-menu-crud";
import { useProductCrud } from "@/hooks/use-product-crud";
import {
  createManagementMenu,
  createManagementProduct,
  updateManagementMenu,
  updateManagementProduct,
} from "@/lib/services/menu-management";
import type {
  CreateMenuRequest,
  CreateProductRequest,
  MenuResult,
  ProductResult,
  UpdateMenuRequest,
  UpdateProductRequest,
} from "@/types/menu-management";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/lib/services/menu-management", () => ({
  createManagementMenu: vi.fn(),
  createManagementMenuItem: vi.fn(),
  createManagementProduct: vi.fn(),
  createManagementProductVariant: vi.fn(),
  deleteManagementMenu: vi.fn(),
  deleteManagementMenuItem: vi.fn(),
  deleteManagementProduct: vi.fn(),
  deleteManagementProductVariant: vi.fn(),
  getMenuManagementErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể cập nhật dữ liệu.") => fallback,
  ),
  updateManagementMenu: vi.fn(),
  updateManagementMenuItem: vi.fn(),
  updateManagementProduct: vi.fn(),
  updateManagementProductVariant: vi.fn(),
}));

const organizationId = "11111111-1111-1111-1111-111111111111";
const product = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Kem demo",
  displayName: "Kem demo",
} as ProductResult;
const menu = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Thực đơn demo",
} as MenuResult;
const productRequest = {
  name: "Kem demo",
} as CreateProductRequest;
const menuRequest = {
  name: "Thực đơn demo",
} as CreateMenuRequest;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("Product/Menu CRUD mutation refresh outcomes", () => {
  beforeEach(() => {
    vi.mocked(createManagementProduct).mockResolvedValue(product);
    vi.mocked(createManagementMenu).mockResolvedValue(menu);
    vi.mocked(updateManagementProduct).mockResolvedValue(product);
    vi.mocked(updateManagementMenu).mockResolvedValue(menu);
  });

  it("keeps Product mutation success when refresh fails", async () => {
    const onChanged = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductCreate());
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitProductCreate(productRequest);
    });

    expect(succeeded).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Đã tạo sản phẩm Kem demo.");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.productFormOpen).toBe(false);
    expect(result.current.refreshWarningMessage).toContain(
      "Sản phẩm đã được cập nhật",
    );
  });

  it("keeps the Product form open and reports only a mutation failure", async () => {
    vi.mocked(createManagementProduct).mockRejectedValueOnce(
      new Error("mutation failed"),
    );
    const onChanged = vi.fn();
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductCreate());
    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.submitProductCreate(productRequest);
    });

    expect(succeeded).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
    expect(result.current.productFormOpen).toBe(true);
    expect(result.current.errorMessage).toBe("sản phẩm");
  });

  it("preserves normal Product success when refresh succeeds", async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductCreate());
    await act(async () => {
      await result.current.submitProductCreate(productRequest);
    });

    expect(onChanged).toHaveBeenCalledWith({ productId: product.id });
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("uses the recovery boundary shared by Product update, variant and delete", async () => {
    const onChanged = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductEdit(product));
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitProductUpdate(
        productRequest as UpdateProductRequest,
      );
    });

    expect(succeeded).toBe(true);
    expect(updateManagementProduct).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).not.toBeNull();
  });

  it("retries only Product reads without repeating the mutation", async () => {
    const onChanged = vi
      .fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductCreate());
    await act(async () => {
      await result.current.submitProductCreate(productRequest);
    });
    await act(async () => {
      await result.current.retryRefresh();
    });

    expect(createManagementProduct).toHaveBeenCalledOnce();
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("preserves the Product duplicate-submit guard", async () => {
    const pendingMutation = deferred<ProductResult>();
    vi.mocked(createManagementProduct).mockReturnValueOnce(
      pendingMutation.promise,
    );
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useProductCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openProductCreate());
    let firstSubmission!: Promise<boolean>;
    let secondResult = true;
    act(() => {
      firstSubmission = result.current.submitProductCreate(productRequest);
    });
    await act(async () => {
      secondResult = await result.current.submitProductCreate(productRequest);
    });

    expect(secondResult).toBe(false);
    expect(createManagementProduct).toHaveBeenCalledOnce();

    pendingMutation.resolve(product);
    await act(async () => {
      await firstSubmission;
    });
  });

  it("uses the same recovery behavior for Menu create", async () => {
    const onChanged = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const { result } = renderHook(() =>
      useMenuCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openMenuForm());
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitMenuCreate(menuRequest);
    });

    expect(succeeded).toBe(true);
    expect(createManagementMenu).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.menuFormOpen).toBe(false);
    expect(result.current.refreshWarningMessage).toContain(
      "Thực đơn đã được cập nhật",
    );
  });

  it("uses the recovery boundary shared by Menu update, item and delete", async () => {
    const onChanged = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const { result } = renderHook(() =>
      useMenuCrud({ organizationId, onChanged }),
    );

    act(() => result.current.openMenuForm(menu));
    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitMenuUpdate(
        menu.id,
        menuRequest as UpdateMenuRequest,
      );
    });

    expect(succeeded).toBe(true);
    expect(updateManagementMenu).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).not.toBeNull();
  });
});
