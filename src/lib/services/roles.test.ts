import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { getManagementRoles, getPermissionMatrix } from "@/lib/services/roles";
import type { ApiResult } from "@/types";
import type {
  ManagementRoleResult,
  PermissionMatrixResult,
} from "@/types/accounts";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn() },
}));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<ApiResult<T>>;
}

describe("role management contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads only backend-authoritative assignable role options", async () => {
    const roles: ManagementRoleResult[] = [{
      code: "Manager",
      name: "Quản lý vận hành",
      description: null,
      isSystemRole: true,
      allowedScopeTypes: ["Organization", "Store"],
      requiresScope: true,
    }];
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: roles }),
    );

    await expect(getManagementRoles()).resolves.toEqual(roles);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/accounts/assignable-role-options",
      { signal: undefined },
    );
  });

  it("keeps the permission matrix on its dedicated management route", async () => {
    const matrix: PermissionMatrixResult = [];
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: matrix }),
    );

    await expect(getPermissionMatrix()).resolves.toEqual(matrix);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/permission-matrix",
      { signal: undefined },
    );
  });
});
