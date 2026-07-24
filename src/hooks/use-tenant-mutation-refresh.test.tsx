import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTenantMutationRefresh } from "@/hooks/use-tenant-mutation-refresh";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("useTenantMutationRefresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps mutation success and exposes a retry when refresh fails", async () => {
    const refresh = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const mutation = vi.fn().mockResolvedValue({ id: "organization-1" });
    const onMutationSuccess = vi.fn();
    const { result } = renderHook(() =>
      useTenantMutationRefresh(
        refresh,
        "Tổ chức đã được cập nhật nhưng dữ liệu mới chưa tải lại được.",
      ),
    );

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.runMutation({
        mutation,
        refreshContext: { organizationId: "organization-1" },
        successMessage: "Đã cập nhật tổ chức.",
        getErrorMessage: () => "Không thể cập nhật tổ chức.",
        onMutationSuccess,
      });
    });

    expect(succeeded).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật tổ chức.");
    expect(onMutationSuccess).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).toContain(
      "dữ liệu mới chưa tải lại được",
    );
  });

  it("reports mutation failure without success or refresh", async () => {
    const refresh = vi.fn();
    const mutation = vi.fn().mockRejectedValue(new Error("mutation failed"));
    const onMutationSuccess = vi.fn();
    const { result } = renderHook(() =>
      useTenantMutationRefresh(refresh, "Không thể tải lại dữ liệu."),
    );

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.runMutation({
        mutation,
        refreshContext: { organizationId: "organization-1" },
        successMessage: "Đã cập nhật tổ chức.",
        getErrorMessage: () => "Không thể cập nhật tổ chức.",
        onMutationSuccess,
      });
    });

    expect(succeeded).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
    expect(onMutationSuccess).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe("Không thể cập nhật tổ chức.");
  });

  it("preserves normal success when refresh succeeds", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const mutation = vi.fn().mockResolvedValue({ id: "store-1" });
    const { result } = renderHook(() =>
      useTenantMutationRefresh(refresh, "Không thể tải lại dữ liệu."),
    );

    await act(async () => {
      await result.current.runMutation({
        mutation,
        refreshContext: { storeId: "store-1" },
        successMessage: "Đã cập nhật cửa hàng.",
        getErrorMessage: () => "Không thể cập nhật cửa hàng.",
      });
    });

    expect(refresh).toHaveBeenCalledWith({ storeId: "store-1" });
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("retries the same read context without repeating the mutation", async () => {
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);
    const mutation = vi.fn().mockResolvedValue({ id: "store-2" });
    const { result } = renderHook(() =>
      useTenantMutationRefresh(refresh, "Không thể tải lại dữ liệu."),
    );

    await act(async () => {
      await result.current.runMutation({
        mutation,
        refreshContext: { storeId: "store-2" },
        successMessage: "Đã cập nhật cửa hàng.",
        getErrorMessage: () => "Không thể cập nhật cửa hàng.",
      });
    });
    await act(async () => {
      await result.current.retryRefresh();
    });

    expect(mutation).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenNthCalledWith(1, { storeId: "store-2" });
    expect(refresh).toHaveBeenNthCalledWith(2, { storeId: "store-2" });
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("guards duplicate submissions while the first mutation is pending", async () => {
    const pendingMutation = deferred<{ id: string }>();
    const mutation = vi.fn().mockReturnValue(pendingMutation.promise);
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTenantMutationRefresh(refresh, "Không thể tải lại dữ liệu."),
    );
    const options = {
      mutation,
      refreshContext: { organizationId: "organization-1" },
      successMessage: "Đã cập nhật tổ chức.",
      getErrorMessage: () => "Không thể cập nhật tổ chức.",
    };

    let firstSubmission!: Promise<boolean>;
    let secondResult = true;
    act(() => {
      firstSubmission = result.current.runMutation(options);
    });
    await act(async () => {
      secondResult = await result.current.runMutation(options);
    });

    expect(secondResult).toBe(false);
    expect(mutation).toHaveBeenCalledOnce();

    pendingMutation.resolve({ id: "organization-1" });
    await act(async () => {
      await firstSubmission;
    });
  });
});
