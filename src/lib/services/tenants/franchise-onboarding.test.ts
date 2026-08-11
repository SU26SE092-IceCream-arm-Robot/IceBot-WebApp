import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  cancelFranchiseOnboarding,
  listFranchiseOnboardings,
  resumeFranchiseOnboarding,
  startFranchiseOnboarding,
} from "@/lib/services/tenants/franchise-onboarding";
import type { ApiResult } from "@/types";
import type {
  FranchiseOnboardingResult,
  FranchiseOnboardingsPage,
  StartFranchiseOnboardingRequest,
} from "@/types/tenants/franchise-onboarding";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const onboarding = { id: "onboarding-1", status: "ReadyForActivation" } as FranchiseOnboardingResult;
const request: StartFranchiseOnboardingRequest = {
  store: { code: "STORE-01", name: "Store 01", storeType: "Retail", timeZone: "Asia/Ho_Chi_Minh", openingHours: [] },
  kiosk: { code: "KIOSK-01", name: "Kiosk 01", kioskType: "RoboticVending", timeZone: "Asia/Ho_Chi_Minh" },
};

describe("franchise onboarding management contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only the selected organization setup history", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [onboarding] }),
      data: { succeeded: true, statusCode: 200, data: [onboarding], pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false } },
    } as AxiosResponse<FranchiseOnboardingsPage>);

    await expect(listFranchiseOnboardings("org-1")).resolves.toMatchObject({ data: [onboarding] });
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/franchise-onboardings",
      { params: { status: undefined, pageNumber: 1, pageSize: 20 }, signal: undefined },
    );
  });

  it("starts through the durable onboarding endpoint with the supplied idempotency key", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 201, data: onboarding }));

    await startFranchiseOnboarding("org-1", "onboarding-key", request);

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/franchise-onboardings",
      request,
      { headers: { "Idempotency-Key": "onboarding-key" } },
    );
  });

  it.each(["resume", "cancel"] as const)("uses the explicit onboarding %s lifecycle route", async (action) => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: onboarding }));

    if (action === "resume") await resumeFranchiseOnboarding("org-1", "onboarding-1");
    else await cancelFranchiseOnboarding("org-1", "onboarding-1", "No longer required");

    expect(axiosClient.post).toHaveBeenCalledWith(
      `/api/v1/management/organizations/org-1/franchise-onboardings/onboarding-1/${action}`,
      ...(action === "resume" ? [] : [{ reason: "No longer required" }]),
    );
  });

  it("does not treat a failed backend envelope as a successful setup", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({ succeeded: false, statusCode: 409, message: "Already running" }));
    await expect(startFranchiseOnboarding("org-1", "onboarding-key", request)).rejects.toThrow("Already running");
  });
});
