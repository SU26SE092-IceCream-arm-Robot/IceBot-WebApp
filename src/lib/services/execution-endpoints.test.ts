import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createExecutionEndpoint,
  listExecutionEndpointsByKiosk,
  setExecutionEndpointLifecycle,
} from "@/lib/services/execution-endpoints";
import type { ApiResult } from "@/types";
import type { ExecutionEndpointResult } from "@/types/execution-endpoints";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
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

describe("execution endpoint read contract", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockReset();
    vi.mocked(axiosClient.post).mockReset();
    vi.mocked(axiosClient.patch).mockReset();
  });

  it("loads endpoints through the scoped management list without credential calls", async () => {
    const items = [{ id: "endpoint-1" }] as ExecutionEndpointResult[];
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({ succeeded: true, statusCode: 200, data: items }),
    );

    await expect(listExecutionEndpointsByKiosk("kiosk-1")).resolves.toEqual(items);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/execution-endpoints",
      { params: { kioskId: "kiosk-1" }, signal: undefined },
    );
  });

  it("creates only a provisioning endpoint without credential payload", async () => {
    const endpoint = { id: "endpoint-1" } as ExecutionEndpointResult;
    vi.mocked(axiosClient.post).mockResolvedValue(
      response({ succeeded: true, statusCode: 201, data: endpoint }),
    );
    const request = { endpointCode: "EDGE-01", executionProfile: "FullEdge" as const };

    await createExecutionEndpoint("kiosk-1", request);

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/execution-endpoints",
      request,
    );
  });

  it.each(["disable", "reactivate", "retire"] as const)(
    "uses the explicit %s lifecycle route",
    async (action) => {
      const endpoint = { id: "endpoint-1" } as ExecutionEndpointResult;
      vi.mocked(axiosClient.patch).mockResolvedValue(
        response({ succeeded: true, statusCode: 200, data: endpoint }),
      );

      await setExecutionEndpointLifecycle("kiosk-1", "endpoint-1", action);

      expect(axiosClient.patch).toHaveBeenCalledWith(
        `/api/v1/management/kiosks/kiosk-1/execution-endpoints/endpoint-1/${action}`,
      );
    },
  );
});
