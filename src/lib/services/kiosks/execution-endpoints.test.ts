import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createExecutionEndpoint,
  listExecutionEndpointsByKiosk,
  provisionExecutionEndpoint,
  rotateExecutionEndpointCredential,
  replaceExecutionEndpointRobotTargets,
  setExecutionEndpointLifecycle,
} from "@/lib/services/kiosks/execution-endpoints";
import type { ApiResult } from "@/types";
import type { ExecutionEndpointResult } from "@/types/kiosks/execution-endpoints";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
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
    vi.mocked(axiosClient.put).mockReset();
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

  it("sets explicit robot targets before endpoint provisioning", async () => {
    const endpoint = { id: "endpoint-1" } as ExecutionEndpointResult;
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: endpoint }));
    await replaceExecutionEndpointRobotTargets("kiosk-1", "endpoint-1", {
      targets: [{ runtimeTargetCode: "FAIRINO", machineModelCode: "FR5", deviceId: "device-1" }],
    });
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/execution-endpoints/endpoint-1/supported-robot-targets",
      { targets: [{ runtimeTargetCode: "FAIRINO", machineModelCode: "FR5", deviceId: "device-1" }] },
    );
  });

  it("provisions with a public credential reference, never an MQTT secret", async () => {
    const endpoint = { id: "endpoint-1" } as ExecutionEndpointResult;
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: endpoint }));
    const request = { profileIdentity: "profile-1", clientCertificateSha256Fingerprint: "fingerprint" };
    await provisionExecutionEndpoint("kiosk-1", "endpoint-1", request);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/execution-endpoints/endpoint-1/provision",
      request,
    );
  });

  it("rotates only the endpoint public credential material", async () => {
    const result = { endpointId: "endpoint-1" } as ExecutionEndpointResult;
    vi.mocked(axiosClient.patch).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: result }));
    await rotateExecutionEndpointCredential("kiosk-1", "endpoint-1", {
      ecdsaPublicKeyPem: "-----BEGIN PUBLIC KEY-----\nkey\n-----END PUBLIC KEY-----",
    });
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/kiosks/kiosk-1/execution-endpoints/endpoint-1/credential",
      { ecdsaPublicKeyPem: "-----BEGIN PUBLIC KEY-----\nkey\n-----END PUBLIC KEY-----" },
    );
  });
});
