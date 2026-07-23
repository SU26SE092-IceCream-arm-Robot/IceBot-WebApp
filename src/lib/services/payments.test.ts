import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import { getPaymentMethods } from "@/lib/services/payments";
import type { ApiResult } from "@/types";
import type { PaymentMethodResult } from "@/types/payments";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

function apiResponse<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<ApiResult<T>>;
}

describe("payment method response contract", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockReset();
  });

  it("throws when the API returns succeeded=false", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse<PaymentMethodResult[]>({
        succeeded: false,
        statusCode: 500,
        message: "Không thể tải cấu hình thanh toán.",
      }),
    );

    await expect(getPaymentMethods()).rejects.toThrow(
      "Không thể tải cấu hình thanh toán.",
    );
  });

  it("returns an empty list when succeeded=true and data is empty", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse<PaymentMethodResult[]>({
        succeeded: true,
        statusCode: 200,
        data: [],
      }),
    );

    await expect(getPaymentMethods()).resolves.toEqual([]);
  });

  it("returns payment method data without changing its fields", async () => {
    const methods: PaymentMethodResult[] = [
      {
        id: 1,
        code: "PAYOS",
        name: "PayOS",
        description: "Cổng thanh toán PayOS",
        isActive: true,
      },
    ];

    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse({
        succeeded: true,
        statusCode: 200,
        data: methods,
      }),
    );

    await expect(getPaymentMethods()).resolves.toEqual(methods);
  });
});
