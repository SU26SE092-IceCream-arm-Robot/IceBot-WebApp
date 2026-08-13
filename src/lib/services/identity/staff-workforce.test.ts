import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  changeStaffWorkforceLifecycle,
  createStaffWorkforce,
  listStaffWorkforce,
  updateStaffWorkforceScopes,
} from "@/lib/services/identity/staff-workforce";
import type { ApiResult } from "@/types";
import type { StaffWorkforceResult } from "@/types/identity/staff-workforce";

vi.mock("@/lib/axios-client", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const staff = { accountId: "staff-1", revision: 3 } as StaffWorkforceResult;

describe("staff workforce contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the organization-scoped list route and server pagination", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [staff] }),
      data: { succeeded: true, statusCode: 200, data: [staff], pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false } },
    });
    await listStaffWorkforce("org/1", { search: "an", status: "Active", pageNumber: 1, pageSize: 20 });
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org%2F1/workforce/staff",
      { params: { search: "an", status: "Active", pageNumber: 1, pageSize: 20 }, signal: undefined },
    );
  });

  it("requires an idempotency key header when creating Staff", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 201, data: staff }));
    const request = { userName: "staff", email: "staff@example.test", localLoginEnabled: true, googleLoginEnabled: false, sendInvitationEmail: true, staffScopes: [{ storeId: "store-1", kioskId: null }] };
    await createStaffWorkforce("org-1", request, "create-key");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/workforce/staff",
      request,
      { headers: { "Idempotency-Key": "create-key" } },
    );
  });

  it("preserves optimistic revision for scope and lifecycle updates", async () => {
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: staff }));
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: staff }));
    await updateStaffWorkforceScopes("org-1", "staff-1", { staffScopes: [{ storeId: "store-1" }], expectedRevision: 3 });
    await changeStaffWorkforceLifecycle("org-1", "staff-1", "deactivate", { idempotencyKey: "lifecycle-key", reason: "Nghỉ việc", expectedRevision: 3 });
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/workforce/staff/staff-1/scopes",
      { staffScopes: [{ storeId: "store-1" }], expectedRevision: 3 },
    );
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/workforce/staff/staff-1/deactivate",
      { idempotencyKey: "lifecycle-key", reason: "Nghỉ việc", expectedRevision: 3 },
    );
  });

  it("does not turn a failed envelope into an empty workforce", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: false, statusCode: 403, message: "Denied" }),
      data: { succeeded: false, statusCode: 403, message: "Denied", pagination: {} },
    });
    await expect(listStaffWorkforce("org-1", { status: "ALL", pageNumber: 1, pageSize: 20 })).rejects.toThrow("Denied");
  });
});

