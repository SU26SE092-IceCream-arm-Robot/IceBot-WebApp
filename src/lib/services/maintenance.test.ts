import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listMaintenanceTicketAssigneeOptions } from "@/lib/services/maintenance";
import type { ApiResult } from "@/types";
import type { MaintenanceAssigneeOptionResult } from "@/types/maintenance";

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

describe("maintenance assignee options contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads eligible assignees in the selected ticket scope", async () => {
    const options: MaintenanceAssigneeOptionResult[] = [{
      accountId: "technician-1",
      displayName: "Kỹ thuật viên A",
      roleCodes: ["Technician"],
    }];
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: options }),
    );

    await expect(
      listMaintenanceTicketAssigneeOptions("ticket/1"),
    ).resolves.toEqual(options);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/maintenance-tickets/ticket%2F1/assignee-options",
      { signal: undefined },
    );
  });

  it("does not turn a failed envelope into an empty option list", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: false, statusCode: 403, message: "Forbidden" }),
    );

    await expect(
      listMaintenanceTicketAssigneeOptions("ticket-1"),
    ).rejects.toThrow("Forbidden");
  });
});
