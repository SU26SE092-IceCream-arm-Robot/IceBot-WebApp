import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { listKioskOperationLogs } from "@/lib/services/operations/logs";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn() },
}));

const pagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

describe("operation log management contract", () => {
  beforeEach(() => vi.mocked(axiosClient.get).mockReset());

  it("uses the kiosk-owned read route without diagnostics", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: { succeeded: true, statusCode: 200, data: [], pagination },
    } as AxiosResponse);

    await listKioskOperationLogs("kiosk-1", {
      pageNumber: 1,
      pageSize: 10,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/operation-logs",
      {
        params: { pageNumber: 1, pageSize: 10 },
        signal: undefined,
      },
    );
    expect(vi.mocked(axiosClient.get).mock.calls[0][0]).not.toContain(
      "diagnostics",
    );
  });

  it("throws a failed envelope instead of showing an empty log", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        succeeded: false,
        statusCode: 500,
        message: "Operation log unavailable",
        data: [],
        pagination,
      },
    } as AxiosResponse);

    await expect(
      listKioskOperationLogs("kiosk-1", { pageNumber: 1, pageSize: 10 }),
    ).rejects.toThrow("Operation log unavailable");
  });
});
