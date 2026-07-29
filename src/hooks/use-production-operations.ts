"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  changePackageUpgradeLifecycle,
  changeRobotProgramLifecycle,
  createConfigurationRelease,
  createRobotProgram,
  deployConfiguration,
  getConfigurationInventoryReadiness,
  getConfigurationReleaseAuthoringOptions,
  forkProductionPackageInstallation,
  getPackageWorkspace,
  getProductionOperationsErrorMessage,
  installProductionPackage,
  discardConfigurationRelease,
  listConfigurationDeployments,
  listConfigurationReleases,
  listPackageInstallations,
  listPackageUpgrades,
  listProductionPackageCatalog,
  listRobotPrograms,
  previewConfigurationDeployment,
  publishConfigurationRelease,
  previewPackageInstallation,
  previewPackageUpgrade,
  recoverPackageInstallation,
  rollbackConfigurationDeployment,
  replaceConfigurationReleaseRoutes,
  retireConfigurationRelease,
  startPackageUpgrade,
  updateRobotProgram,
} from "@/lib/services/production-operations";
import type {
  ConfigurationDeploymentResult,
  ConfigurationReleaseResult,
  ConfigurationReleaseAuthoringOptions,
  ConfigurationReleaseRouteRequest,
  CreateRobotProgramRequest,
  DeploymentPreview,
  InventoryReadinessResult,
  PackageInstallationPreview,
  PackageInstallationResult,
  PackageInstallRequest,
  PackageUpgradePreviewResult,
  PackageUpgradeResult,
  PackageWorkspaceResult,
  ProductionPackageResult,
  RobotProgramResult,
  UpdateRobotProgramRequest,
} from "@/types/production-operations";

interface ProductionOperationsScope {
  organizationId: string;
  storeId: string;
  kioskId: string;
}

export function useProductionOperations(scope: ProductionOperationsScope) {
  const [programs, setPrograms] = useState<RobotProgramResult[]>([]);
  const [packages, setPackages] = useState<ProductionPackageResult[]>([]);
  const [installations, setInstallations] = useState<PackageInstallationResult[]>([]);
  const [releases, setReleases] = useState<ConfigurationReleaseResult[]>([]);
  const [releaseAuthoringOptions, setReleaseAuthoringOptions] = useState<ConfigurationReleaseAuthoringOptions | null>(null);
  const [deployments, setDeployments] = useState<ConfigurationDeploymentResult[]>([]);
  const [workspaces, setWorkspaces] = useState<Record<string, PackageWorkspaceResult>>({});
  const [upgrades, setUpgrades] = useState<Record<string, PackageUpgradeResult[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [installationPreview, setInstallationPreview] = useState<PackageInstallationPreview | null>(null);
  const [upgradePreview, setUpgradePreview] = useState<PackageUpgradePreviewResult | null>(null);
  const [deploymentPreview, setDeploymentPreview] = useState<DeploymentPreview | null>(null);
  const [inventoryReadiness, setInventoryReadiness] = useState<InventoryReadinessResult | null>(null);
  const mutationRef = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setWarnings([]);
    const results = await Promise.allSettled([
      listRobotPrograms(scope.organizationId, signal),
      listProductionPackageCatalog(scope.organizationId, signal),
      listPackageInstallations(scope.organizationId, scope.kioskId, signal),
      listConfigurationReleases(scope.organizationId, signal),
      listConfigurationDeployments(scope.kioskId, signal),
    ]);
    if (signal?.aborted) return;

    const nextWarnings: string[] = [];
    const assign = <T,>(result: PromiseSettledResult<T>, setter: (value: T) => void, label: string) => {
      if (result.status === "fulfilled") setter(result.value);
      else if (!axios.isCancel(result.reason)) nextWarnings.push(getProductionOperationsErrorMessage(result.reason, `Không thể tải ${label}.`));
    };
    assign(
      results[0],
      (items) => setPrograms(items.filter((program) =>
        program.kioskId
          ? program.kioskId === scope.kioskId
          : program.storeId
            ? program.storeId === scope.storeId
            : program.organizationId === scope.organizationId,
      )),
      "chương trình robot",
    );
    assign(results[1], setPackages, "danh mục gói sản xuất");
    assign(results[2], setInstallations, "gói đã cài đặt");
    assign(results[3], setReleases, "bản phát hành cấu hình");
    assign(results[4], setDeployments, "lịch sử triển khai");
    setWarnings([...new Set(nextWarnings)]);
    setIsLoading(false);
    return nextWarnings.length === 0;
  }, [scope.kioskId, scope.organizationId, scope.storeId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [load]);

  const runMutation = useCallback(async <T,>(
    mutation: () => Promise<T>,
    successMessage: string,
    after?: (result: T) => void,
  ) => {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await mutation();
      after?.(result);
      toast.success(successMessage);
      try {
        const refreshedCompletely = await load();
        if (!refreshedCompletely) {
          toast.warning("Thao tác đã thành công nhưng một phần dữ liệu mới chưa tải lại được. Hãy dùng nút Làm mới.");
        }
      } catch {
        toast.warning("Thao tác đã thành công nhưng dữ liệu mới chưa tải lại được. Hãy dùng nút Làm mới.");
      }
      return result;
    } catch (error) {
      const message = getProductionOperationsErrorMessage(error, "Không thể hoàn tất thao tác.");
      setMutationError(message);
      toast.error(message);
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [load]);

  const loadWorkspace = useCallback(async (installationId: string) => {
    setMutationError(null);
    try {
      const [workspace, history] = await Promise.all([
        getPackageWorkspace(scope.organizationId, installationId),
        listPackageUpgrades(scope.organizationId, installationId),
      ]);
      setWorkspaces((current) => ({ ...current, [installationId]: workspace }));
      setUpgrades((current) => ({ ...current, [installationId]: history }));
      return workspace;
    } catch (error) {
      setMutationError(getProductionOperationsErrorMessage(error, "Không thể tải chi tiết gói sản xuất."));
      return null;
    }
  }, [scope.organizationId]);

  const previewInstall = useCallback(async (request: PackageInstallRequest) => {
    setMutationError(null);
    setInstallationPreview(null);
    try {
      const preview = await previewPackageInstallation(scope.organizationId, request);
      setInstallationPreview(preview);
      return preview;
    } catch (error) {
      setMutationError(getProductionOperationsErrorMessage(error, "Không thể xem trước gói sản xuất."));
      return null;
    }
  }, [scope.organizationId]);

  const previewUpgrade = useCallback(async (installationId: string, targetVersionId: string, productSourceKeys: string[]) => {
    setMutationError(null);
    setUpgradePreview(null);
    try {
      const preview = await previewPackageUpgrade(scope.organizationId, installationId, targetVersionId, productSourceKeys);
      setUpgradePreview(preview);
      return preview;
    } catch (error) {
      setMutationError(getProductionOperationsErrorMessage(error, "Không thể xem trước nâng cấp gói."));
      return null;
    }
  }, [scope.organizationId]);

  const previewDeployment = useCallback(async (releaseId: string) => {
    setMutationError(null);
    setDeploymentPreview(null);
    setInventoryReadiness(null);
    try {
      const [preview, readiness] = await Promise.all([
        previewConfigurationDeployment(scope.kioskId, releaseId),
        getConfigurationInventoryReadiness(scope.kioskId, releaseId),
      ]);
      setDeploymentPreview(preview);
      setInventoryReadiness(readiness);
      return preview;
    } catch (error) {
      setMutationError(getProductionOperationsErrorMessage(error, "Không thể kiểm tra điều kiện triển khai."));
      return null;
    }
  }, [scope.kioskId]);

  const loadReleaseAuthoringOptions = useCallback(async () => {
    setMutationError(null);
    try {
      const options = await getConfigurationReleaseAuthoringOptions(scope.organizationId);
      setReleaseAuthoringOptions(options);
      return options;
    } catch (error) {
      setMutationError(getProductionOperationsErrorMessage(error, "Khong the tai du lieu soan ban phat hanh."));
      return null;
    }
  }, [scope.organizationId]);

  return {
    programs,
    packages,
    installations,
    releases,
    releaseAuthoringOptions,
    deployments,
    workspaces,
    upgrades,
    isLoading,
    isMutating,
    warnings,
    mutationError,
    installationPreview,
    upgradePreview,
    deploymentPreview,
    inventoryReadiness,
    refresh: () => load(),
    clearMutationError: () => setMutationError(null),
    clearPreviews: () => {
      setInstallationPreview(null);
      setUpgradePreview(null);
      setDeploymentPreview(null);
      setInventoryReadiness(null);
    },
    loadWorkspace,
    loadReleaseAuthoringOptions,
    createProgram: (request: CreateRobotProgramRequest) => runMutation(
      () => createRobotProgram(scope.organizationId, { ...request, storeId: scope.storeId, kioskId: scope.kioskId }),
      "Đã tạo bản nháp chương trình robot.",
    ),
    updateProgram: (programId: string, request: UpdateRobotProgramRequest) => runMutation(
      () => updateRobotProgram(scope.organizationId, programId, request),
      "Đã cập nhật chương trình robot.",
    ),
    changeProgramLifecycle: (programId: string, action: "publish" | "retire" | "discard") => runMutation(
      () => changeRobotProgramLifecycle(scope.organizationId, programId, action),
      action === "publish" ? "Đã phát hành chương trình robot." : action === "retire" ? "Đã ngừng sử dụng chương trình robot." : "Đã xóa bản nháp chương trình robot.",
    ),
    createRelease: () => runMutation(
      () => createConfigurationRelease(scope.organizationId),
      "Da tao ban nhap cau hinh.",
    ),
    replaceReleaseRoutes: (releaseId: string, routes: ConfigurationReleaseRouteRequest[]) => runMutation(
      () => replaceConfigurationReleaseRoutes(scope.organizationId, releaseId, routes),
      "Da cap nhat tuyen san xuat cho ban nhap.",
    ),
    changeReleaseLifecycle: (releaseId: string, action: "publish" | "retire" | "discard") => runMutation(
      async () => {
        if (action === "publish") return publishConfigurationRelease(scope.organizationId, releaseId);
        if (action === "retire") return retireConfigurationRelease(scope.organizationId, releaseId);
        await discardConfigurationRelease(scope.organizationId, releaseId);
        return null;
      },
      action === "publish" ? "Da phat hanh cau hinh." : action === "retire" ? "Da ngung su dung ban phat hanh." : "Da xoa ban nhap cau hinh.",
    ),
    previewInstall,
    installPackage: (request: PackageInstallRequest) => runMutation(
      () => installProductionPackage(scope.organizationId, request),
      "Đã bắt đầu cài đặt gói sản xuất.",
    ),
    recoverInstallation: (installationId: string, action: "retry" | "repair") => runMutation(
      () => recoverPackageInstallation(scope.organizationId, installationId, action),
      action === "retry" ? "Đã yêu cầu thử lại cài đặt gói." : "Đã yêu cầu sửa dữ liệu cài đặt gói.",
    ),
    forkInstallation: (installationId: string) => runMutation(
      () => forkProductionPackageInstallation(scope.organizationId, installationId),
      "Da tach nhanh cau hinh ky thuat thanh ban sao cua to chuc.",
    ),
    previewUpgrade,
    startUpgrade: (installationId: string, preview: PackageUpgradePreviewResult) => runMutation(
      () => startPackageUpgrade(scope.organizationId, installationId, preview),
      "Đã bắt đầu materialize phiên bản gói mới.",
    ),
    changeUpgradeLifecycle: (installationId: string, upgradeId: string, action: "cutover" | "abandon" | "rollback", reason?: string) => runMutation(
      () => changePackageUpgradeLifecycle(scope.organizationId, installationId, upgradeId, action, reason),
      action === "cutover" ? "Đã chuyển sang phiên bản gói mới." : action === "abandon" ? "Đã hủy tiến trình nâng cấp." : "Đã yêu cầu rollback nâng cấp.",
    ),
    previewDeployment,
    deploy: (preview: DeploymentPreview, endpointId: string, acknowledgeRisk: boolean) => runMutation(
      () => deployConfiguration(scope.kioskId, preview, endpointId, acknowledgeRisk),
      "Đã gửi yêu cầu triển khai cấu hình.",
    ),
    rollbackDeployment: (deploymentId: string) => runMutation(
      () => rollbackConfigurationDeployment(scope.kioskId, deploymentId),
      "Đã gửi yêu cầu rollback cấu hình.",
    ),
  };
}
