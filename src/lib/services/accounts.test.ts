import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  assignAccountRoles,
  createAccount,
  disableAccount,
  getAccountById,
  listManagementAccounts,
  regenerateInvitation,
  resetAccountPassword,
} from "@/lib/services/accounts";
import type { ApiResult } from "@/types";
import type {
  CreateInternalAccountRequest,
  InternalAccountResult,
  PagedResult,
} from "@/types/accounts";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const organizationId = "11111111-1111-1111-1111-111111111111";
const accountId = "22222222-2222-2222-2222-222222222222";
const basePath = `/api/v1/management/organizations/${organizationId}/accounts`;

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<T>;
}

describe("organization-scoped account service contract", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockReset();
    vi.mocked(axiosClient.patch).mockReset();
    vi.mocked(axiosClient.post).mockReset();
    vi.mocked(axiosClient.put).mockReset();
  });

  it("lists accounts through the organization-owned route", async () => {
    const result: PagedResult<InternalAccountResult> = {
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
    vi.mocked(axiosClient.get).mockResolvedValue(response(result));

    await listManagementAccounts(organizationId, {
      searchTerm: "",
      status: "ALL",
      pageNumber: 1,
      pageSize: 20,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      basePath,
      expect.objectContaining({
        params: expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
      }),
    );
  });

  it("loads account detail through the same organization context", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      response<ApiResult<InternalAccountResult>>({
        succeeded: true,
        statusCode: 200,
        data: { id: accountId } as InternalAccountResult,
      }),
    );

    await getAccountById(organizationId, accountId);

    expect(axiosClient.get).toHaveBeenCalledWith(`${basePath}/${accountId}`, {
      signal: undefined,
    });
  });

  it("creates an account without changing its request body", async () => {
    const request: CreateInternalAccountRequest = {
      userName: "org-user",
      email: "org-user@example.com",
      localLoginEnabled: false,
      googleLoginEnabled: true,
      googleEmail: "org-user@example.com",
      createInvitation: true,
      sendInvitationEmail: true,
      roles: [{ roleCode: "Manager", organizationId }],
    };
    vi.mocked(axiosClient.post).mockResolvedValue(
      response<ApiResult<InternalAccountResult>>({
        succeeded: true,
        statusCode: 201,
        data: { id: accountId } as InternalAccountResult,
      }),
    );

    await createAccount(organizationId, request);

    expect(axiosClient.post).toHaveBeenCalledWith(basePath, request);
  });

  it("keeps organization context on account management mutations", async () => {
    const accountResult: ApiResult<InternalAccountResult> = {
      succeeded: true,
      statusCode: 200,
      data: { id: accountId } as InternalAccountResult,
    };
    vi.mocked(axiosClient.patch).mockResolvedValue(response(accountResult));
    vi.mocked(axiosClient.put).mockResolvedValue(response(accountResult));
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({
        succeeded: true,
        statusCode: 200,
        data: { accountId },
      }),
    );

    await disableAccount(organizationId, accountId);
    await resetAccountPassword(organizationId, accountId, {
      newPassword: "ValidPassword123!",
    });
    await assignAccountRoles(organizationId, accountId, {
      roles: [{ roleCode: "Manager", organizationId }],
    });
    await regenerateInvitation(organizationId, accountId, false);

    expect(axiosClient.patch).toHaveBeenCalledWith(
      `${basePath}/${accountId}/disable`,
    );
    expect(axiosClient.put).toHaveBeenNthCalledWith(
      1,
      `${basePath}/${accountId}/password`,
      { newPassword: "ValidPassword123!" },
    );
    expect(axiosClient.put).toHaveBeenNthCalledWith(
      2,
      `${basePath}/${accountId}/roles`,
      { roles: [{ roleCode: "Manager", organizationId }] },
    );
    expect(axiosClient.post).toHaveBeenCalledWith(
      `${basePath}/${accountId}/invitation`,
      { sendEmail: false },
    );
  });
});
