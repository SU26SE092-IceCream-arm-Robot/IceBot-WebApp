import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  getServiceRegistrationErrorMessage,
  submitServiceRegistration,
} from "@/lib/services/service-registrations";
import type { ApiResult } from "@/types";
import type {
  CreateServiceRegistrationRequest,
  ServiceRegistrationResult,
} from "@/types/service-registrations";

vi.mock("@/lib/axios-client", () => ({
  default: { post: vi.fn() },
}));

const mockRequest: CreateServiceRegistrationRequest = {
  contactName: "Nguyen Van A",
  email: "owner@example.com",
  phoneNumber: "0901234567",
  businessName: "Kem IceBot",
  legalName: null,
  taxCode: null,
  address: "TP.HCM",
  expectedLocationCount: 1,
  message: "Kiosk demo",
  privacyPolicyAccepted: true,
  privacyPolicyRevisionId: "b8387063-e4d0-4d51-aefc-f1797cfae4f2",
};

const mockResult: ServiceRegistrationResult = {
  id: "sr-123",
  referenceCode: "SR-2026-000123",
  status: "Submitted",
  submittedAt: "2026-08-17T04:00:00Z",
};

describe("service registration contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits registration with wrapped ApiResult response and specified idempotency key", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: mockResult,
      } as ApiResult<ServiceRegistrationResult>,
    } as AxiosResponse);

    const result = await submitServiceRegistration(mockRequest, "custom-idempotency-key");

    expect(result).toEqual(mockResult);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/service-registrations",
      mockRequest,
      {
        headers: {
          "Idempotency-Key": "custom-idempotency-key",
        },
      },
    );
  });

  it("submits registration with direct JSON response and auto-generated idempotency key", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: mockResult,
    } as AxiosResponse);

    const result = await submitServiceRegistration(mockRequest);

    expect(result).toEqual(mockResult);
    expect(axiosClient.post).toHaveBeenCalledTimes(1);
    const postArgs = vi.mocked(axiosClient.post).mock.calls[0];
    expect(postArgs[0]).toBe("/api/v1/service-registrations");
    expect(postArgs[1]).toEqual(mockRequest);
    expect(postArgs[2]?.headers?.["Idempotency-Key"]).toBeTruthy();
  });

  it("handles server validation error messages properly", () => {
    const errorWithValidation = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          succeeded: false,
          validationErrors: {
            Email: ["Email không hợp lệ."],
            BusinessName: ["Tên doanh nghiệp quá dài."],
          },
        },
      },
    };

    const message = getServiceRegistrationErrorMessage(errorWithValidation);
    expect(message).toContain("Email không hợp lệ.");
    expect(message).toContain("Tên doanh nghiệp quá dài.");
  });
});
