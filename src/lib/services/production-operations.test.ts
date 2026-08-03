import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createConfigurationRelease,
  createRobotAuthoringReleaseDraft,
  discardConfigurationRelease,
  changePackageUpgradeLifecycle,
  deployConfiguration,
  forkProductionPackageInstallation,
  getConfigurationRelease,
  getConfigurationReleaseAuthoringOptions,
  getConfigurationInventoryReadiness,
  installProductionPackage,
  listRobotAuthoringImports,
  listPackageInstallations,
  previewConfigurationDeployment,
  previewPackageUpgrade,
  publishConfigurationRelease,
  recoverPackageInstallation,
  replaceConfigurationReleaseRoutes,
  retireConfigurationRelease,
  rollbackConfigurationDeployment,
  startPackageUpgrade,
  uploadRobotAuthoringImport,
  validateRobotAuthoringImport,
} from "@/lib/services/production-operations";
import type { ApiResult } from "@/types";
import type {
  ConfigurationDeploymentResult,
  ConfigurationReleaseAuthoringOptions,
  ConfigurationReleaseResult,
  RobotAuthoringImportResult,
  ConfigurationReleaseRouteRequest,
  DeploymentPreview,
  PackageInstallationResult,
  PackageInstallationsPage,
  PackageUpgradePreviewResult,
  PackageUpgradeResult,
} from "@/types/production-operations";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const installation = { id: "installation-1" } as PackageInstallationResult;
const upgrade = { id: "upgrade-1" } as PackageUpgradeResult;
const deployment = { id: "deployment-1" } as ConfigurationDeploymentResult;
const release = { id: "release-1" } as ConfigurationReleaseResult;

describe("production operations management contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "request-id" });
  });

  it("lists package installations only in the selected organization and kiosk scope", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [installation] }),
      data: {
        succeeded: true,
        statusCode: 200,
        data: [installation],
        pagination: { page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
      },
    } as AxiosResponse<PackageInstallationsPage>);

    await listPackageInstallations("org-1", "kiosk-1");
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/production-package-installations",
      { params: { kioskId: "kiosk-1", pageNumber: 1, pageSize: 100 }, signal: undefined },
    );
  });

  it("loads every package installation page instead of truncating the kiosk history", async () => {
    const secondInstallation = { id: "installation-2" } as PackageInstallationResult;
    vi.mocked(axiosClient.get)
      .mockResolvedValueOnce({
        ...response({ succeeded: true, statusCode: 200, data: [installation] }),
        data: {
          succeeded: true,
          statusCode: 200,
          data: [installation],
          pagination: { page: 1, pageSize: 100, totalCount: 2, totalPages: 2, hasNext: true, hasPrevious: false },
        },
      } as AxiosResponse<PackageInstallationsPage>)
      .mockResolvedValueOnce({
        ...response({ succeeded: true, statusCode: 200, data: [secondInstallation] }),
        data: {
          succeeded: true,
          statusCode: 200,
          data: [secondInstallation],
          pagination: { page: 2, pageSize: 100, totalCount: 2, totalPages: 2, hasNext: false, hasPrevious: true },
        },
      } as AxiosResponse<PackageInstallationsPage>);

    await expect(listPackageInstallations("org-1", "kiosk-1")).resolves.toEqual([
      installation,
      secondInstallation,
    ]);
    expect(axiosClient.get).toHaveBeenNthCalledWith(2,
      "/api/v1/management/organizations/org-1/production-package-installations",
      { params: { kioskId: "kiosk-1", pageNumber: 2, pageSize: 100 }, signal: undefined },
    );
  });

  it("installs with a server-safe idempotency key and exact scoped payload", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: installation }));
    const request = { packageId: "package-1", packageVersionId: "version-1", storeId: "store-1", kioskId: "kiosk-1", productSourceKeys: ["ICE_CREAM"] };

    await installProductionPackage("org-1", request);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/production-package-installations",
      request,
      { headers: { "Idempotency-Key": "package-install-request-id" } },
    );
  });

  it("does not turn a failed install envelope into a successful installation", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({ succeeded: false, statusCode: 409, message: "Installation conflict" }),
    );

    await expect(installProductionPackage("org-1", {
      packageId: "package-1",
      packageVersionId: "version-1",
      kioskId: "kiosk-1",
      productSourceKeys: ["ICE_CREAM"],
    })).rejects.toThrow("Installation conflict");
  });

  it.each(["retry", "repair"] as const)("uses the explicit package %s recovery route", async (action) => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: installation }));
    await recoverPackageInstallation("org-1", "installation-1", action);
    expect(axiosClient.post).toHaveBeenCalledWith(
      `/api/v1/management/organizations/org-1/production-package-installations/installation-1/${action}`,
    );
  });

  it("preserves the authoritative upgrade preview checksum during materialization", async () => {
    const preview = {
      targetPackageVersionId: "version-2",
      previewChecksum: "a".repeat(64),
      selectedProductSourceKeys: ["ICE_CREAM"],
    } as PackageUpgradePreviewResult;
    vi.mocked(axiosClient.post)
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 200, data: preview }))
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 200, data: upgrade }));

    await previewPackageUpgrade("org-1", "installation-1", "version-2", ["ICE_CREAM"]);
    await startPackageUpgrade("org-1", "installation-1", preview);

    expect(axiosClient.post).toHaveBeenLastCalledWith(
      "/api/v1/management/organizations/org-1/production-package-installations/installation-1/upgrades",
      { targetPackageVersionId: "version-2", previewChecksum: "a".repeat(64), productSourceKeys: ["ICE_CREAM"] },
      { headers: { "Idempotency-Key": "package-upgrade-request-id" } },
    );
  });

  it.each([
    ["cutover", undefined],
    ["abandon", "Không tiếp tục"],
    ["rollback", "Khôi phục phiên bản trước"],
  ] as const)("uses the exact upgrade %s lifecycle route", async (action, reason) => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: upgrade }));
    await changePackageUpgradeLifecycle("org-1", "installation-1", "upgrade-1", action, reason);
    expect(axiosClient.post).toHaveBeenCalledWith(
      `/api/v1/management/organizations/org-1/production-package-installations/installation-1/upgrades/upgrade-1/${action}`,
      action === "cutover" ? undefined : { reason },
    );
  });

  it("previews through management and deploys low-cost selections from the authoritative preview", async () => {
    const preview: DeploymentPreview = {
      configurationReleaseId: "release-1",
      releaseChecksum: "release-checksum",
      kioskId: "kiosk-1",
      requiresEndpointSelection: false,
      endpoints: [{
        kioskExecutionEndpointId: "endpoint-1",
        endpointCode: "EDGE-1",
        executionProfile: "LowCostController",
        isEligible: true,
        blockers: [],
        selections: [{ executionRouteId: "route-1", robotProgramId: "program-1" }],
        installationModes: ["LimitedActiveArtifactSet"],
        artifactCount: 1,
        artifactStorageBytes: 100,
        deploymentChecksum: "b".repeat(64),
      }],
    };
    vi.mocked(axiosClient.post)
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 200, data: preview }))
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 200, data: deployment }));

    await previewConfigurationDeployment("kiosk-1", "release-1");
    await deployConfiguration(
      "kiosk-1",
      preview,
      "endpoint-1",
      true,
      "Triển khai cấu hình đã kiểm tra",
    );

    expect(axiosClient.post).toHaveBeenNthCalledWith(1,
      "/api/v1/management/kiosks/kiosk-1/configuration-deployments/preview",
      { configurationReleaseId: "release-1", selections: [] },
    );
    expect(axiosClient.post).toHaveBeenNthCalledWith(2,
      "/api/v1/management/kiosks/kiosk-1/configuration-deployments/low-cost",
      {
        configurationReleaseId: "release-1",
        kioskExecutionEndpointId: "endpoint-1",
        deploymentPreviewChecksum: "b".repeat(64),
        acknowledgeRemainingRisk: true,
        reason: "Triển khai cấu hình đã kiểm tra",
        selections: [{ executionRouteId: "route-1", robotProgramId: "program-1" }],
      },
      { headers: { "Idempotency-Key": "configuration-deploy-request-id" } },
    );
  });

  it("checks inventory readiness in the selected kiosk and release context", async () => {
    const readiness = { kioskId: "kiosk-1", isReady: true };
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: readiness }),
    );

    await getConfigurationInventoryReadiness("kiosk-1", "release-1");
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/configuration-releases/release-1/inventory-readiness",
    );
  });

  it("rolls back only through the management deployment route with idempotency", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: deployment }));
    await rollbackConfigurationDeployment(
      "kiosk-1",
      "deployment-1",
      "deployment-active",
      "Khôi phục cấu hình ổn định trước đó",
    );
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/configuration-deployments/deployment-1/rollback",
      {
        expectedActiveDeploymentId: "deployment-active",
        reason: "Khôi phục cấu hình ổn định trước đó",
      },
      { headers: { "Idempotency-Key": "configuration-rollback-request-id" } },
    );
  });

  it("loads release authoring options from the selected organization scope", async () => {
    const options = { recipes: [], programs: [] } as unknown as ConfigurationReleaseAuthoringOptions;
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: options }),
    );

    await getConfigurationReleaseAuthoringOptions("org-1");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/configuration-releases/authoring-options",
      { signal: undefined },
    );
  });

  it("uses the exact release draft and route-authoring management contracts", async () => {
    const routes = [{
      recipeId: "recipe-1",
      routeCode: "ROUTE-1",
      priority: 1,
      requiredCapabilities: [{ code: "DISPENSE", required: true }],
      supportedOptionCodes: [],
      robotBindings: [{
        robotProgramId: "program-1",
        bindingOrder: 1,
        requiredWorkcellCapabilityCode: "DISPENSE",
      }],
    }] as ConfigurationReleaseRouteRequest[];
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({ succeeded: true, statusCode: 201, data: release }),
    );
    vi.mocked(axiosClient.put).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: release }),
    );

    await createConfigurationRelease("org-1");
    await replaceConfigurationReleaseRoutes(
      "org-1",
      "release-1",
      "a".repeat(64),
      routes,
    );

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/configuration-releases",
    );
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/configuration-releases/release-1/routes",
      { expectedRevision: "a".repeat(64), routes },
    );
  });

  it.each(["publish", "retire"] as const)(
    "uses the exact release %s lifecycle route",
    async (action) => {
      vi.mocked(axiosClient.patch).mockResolvedValue(
        response({ succeeded: true, statusCode: 200, data: release }),
      );

      if (action === "publish") {
        await publishConfigurationRelease("org-1", "release-1");
      } else {
        await retireConfigurationRelease("org-1", "release-1");
      }

      expect(axiosClient.patch).toHaveBeenCalledWith(
        `/api/v1/management/organizations/org-1/configuration-releases/release-1/${action}`,
      );
    },
  );

  it("discards only the selected release draft", async () => {
    vi.mocked(axiosClient.delete).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: {} }),
    );

    await discardConfigurationRelease("org-1", "release-1");

    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/configuration-releases/release-1",
    );
  });

  it("loads full release detail before replace-all route authoring", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: release }),
    );

    await getConfigurationRelease("org-1", "release-1");

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/configuration-releases/release-1",
      { signal: undefined },
    );
  });

  it("lists authoring imports in the selected organization with only supported filters", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [] }),
      data: {
        succeeded: true,
        statusCode: 200,
        data: [],
        pagination: { page: 2, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: true },
      },
    });

    await listRobotAuthoringImports("org-1", {
      status: "Failed",
      kioskId: "kiosk-1",
      search: "  fairino  ",
      createdFrom: "2026-08-01T00:00:00Z",
      createdTo: "2026-08-03T23:59:59Z",
      pageNumber: 2,
      pageSize: 10,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/robot-authoring-imports",
      {
        params: {
          status: "Failed",
          kioskId: "kiosk-1",
          search: "fairino",
          createdFrom: "2026-08-01T00:00:00Z",
          createdTo: "2026-08-03T23:59:59Z",
          pageNumber: 2,
          pageSize: 10,
        },
        signal: undefined,
      },
    );
  });

  it("uploads an authoring bundle through management with a fresh idempotency key", async () => {
    const imported = { id: "import-1" } as RobotAuthoringImportResult;
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({ succeeded: true, statusCode: 201, data: imported }),
    );
    const bundle = new File(["bundle"], "fairino.zip", { type: "application/zip" });

    await uploadRobotAuthoringImport("org-1", { bundle, kioskId: "kiosk-1" });

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/robot-authoring-imports",
      expect.any(FormData),
      { headers: { "Idempotency-Key": "robot-authoring-import-request-id" } },
    );
    const formData = vi.mocked(axiosClient.post).mock.calls[0]?.[1] as FormData;
    expect(formData.get("bundle")).toBe(bundle);
    expect(formData.get("kioskId")).toBe("kiosk-1");
  });

  it("uses the import lifecycle and release-draft contracts without direct robot calls", async () => {
    vi.mocked(axiosClient.post)
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 200, data: { id: "import-1" } }))
      .mockResolvedValueOnce(response({ succeeded: true, statusCode: 201, data: { import: { id: "import-1" }, configurationRelease: release } }));

    await validateRobotAuthoringImport("org-1", "import-1");
    await createRobotAuthoringReleaseDraft("org-1", "import-1", {
      recipeId: "recipe-1",
      requiredWorkcellCapabilityCode: null,
      supportedOptionCodes: ["TOPPING"],
    });

    expect(axiosClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/management/organizations/org-1/robot-authoring-imports/import-1/validate",
    );
    expect(axiosClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/management/organizations/org-1/robot-authoring-imports/import-1/create-release-draft",
      { recipeId: "recipe-1", requiredWorkcellCapabilityCode: null, supportedOptionCodes: ["TOPPING"] },
    );
  });

  it("forks a package installation only through its organization-scoped route", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: installation }),
    );

    await forkProductionPackageInstallation("org-1", "installation-1");

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/production-package-installations/installation-1/fork",
    );
  });
});
