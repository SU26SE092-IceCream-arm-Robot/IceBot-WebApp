import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductionOperations } from "@/hooks/production/use-production-operations";
import {
  installProductionPackage,
  listConfigurationDeployments,
  listConfigurationReleases,
  listPackageInstallations,
  listProductionPackageCatalog,
  listRobotPrograms,
} from "@/lib/services/production/operations";
import type { PackageInstallationResult } from "@/types/production/operations";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/services/production/operations", () => ({
  changePackageUpgradeLifecycle: vi.fn(),
  changeRobotProgramLifecycle: vi.fn(),
  createRobotProgram: vi.fn(),
  deployConfiguration: vi.fn(),
  getConfigurationInventoryReadiness: vi.fn(),
  getPackageWorkspace: vi.fn(),
  getProductionOperationsErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  installProductionPackage: vi.fn(),
  getConfigurationRelease: vi.fn(),
  getConfigurationReleaseAuthoringOptions: vi.fn(),
  listConfigurationDeployments: vi.fn(),
  listConfigurationReleases: vi.fn(),
  listPackageInstallations: vi.fn(),
  listPackageUpgrades: vi.fn(),
  listProductionPackageCatalog: vi.fn(),
  listRobotPrograms: vi.fn(),
  previewConfigurationDeployment: vi.fn(),
  previewPackageInstallation: vi.fn(),
  previewPackageUpgrade: vi.fn(),
  recoverPackageInstallation: vi.fn(),
  rollbackConfigurationDeployment: vi.fn(),
  startPackageUpgrade: vi.fn(),
  updateRobotProgram: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const scope = { organizationId: "org-1", storeId: "store-1", kioskId: "kiosk-1" };
const request = {
  packageId: "package-1",
  packageVersionId: "version-1",
  storeId: "store-1",
  kioskId: "kiosk-1",
  productSourceKeys: ["ICE_CREAM"],
};

describe("useProductionOperations mutation safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listRobotPrograms).mockResolvedValue([]);
    vi.mocked(listProductionPackageCatalog).mockResolvedValue([]);
    vi.mocked(listPackageInstallations).mockResolvedValue([]);
    vi.mocked(listConfigurationReleases).mockResolvedValue([]);
    vi.mocked(listConfigurationDeployments).mockResolvedValue([]);
  });

  it("prevents a duplicate package installation while the first request is pending", async () => {
    const pending = deferred<PackageInstallationResult>();
    vi.mocked(installProductionPackage).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useProductionOperations(scope));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let first!: Promise<PackageInstallationResult | null>;
    act(() => {
      first = result.current.installPackage(request);
    });
    await act(async () => {
      await result.current.installPackage(request);
    });
    expect(installProductionPackage).toHaveBeenCalledOnce();

    pending.resolve({ id: "installation-1" } as PackageInstallationResult);
    await act(async () => {
      await first;
    });
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("does not report success when the package mutation fails", async () => {
    vi.mocked(installProductionPackage).mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() => useProductionOperations(scope));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.installPackage(request);
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledOnce();
    expect(result.current.mutationError).toBe("Không thể hoàn tất thao tác.");
  });

  it("keeps mutation success and reports a separate warning when refresh is partial", async () => {
    vi.mocked(installProductionPackage).mockResolvedValue({ id: "installation-1" } as PackageInstallationResult);
    vi.mocked(listConfigurationDeployments)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("refresh failed"));
    const { result } = renderHook(() => useProductionOperations(scope));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.installPackage(request);
    });

    expect(installProductionPackage).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Đã bắt đầu cài đặt gói sản xuất.");
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      "Thao tác đã thành công nhưng một phần dữ liệu mới chưa tải lại được. Hãy dùng nút Làm mới.",
    );

    await act(async () => {
      await result.current.refresh();
    });
    expect(installProductionPackage).toHaveBeenCalledOnce();
  });
});
