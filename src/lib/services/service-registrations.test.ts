import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  approveServiceRegistration,
  getManagementServiceRegistration,
  getServiceRegistrationErrorMessage,
  listManagementServiceRegistrations,
  rejectServiceRegistration,
  retryProvisioningServiceRegistration,
  startReviewServiceRegistration,
  submitServiceRegistration,
} from "@/lib/services/service-registrations";
import type { ApiResult } from "@/types";
import type {
  ApproveServiceRegistrationRequest,
  CreateServiceRegistrationRequest,
  ManagementServiceRegistrationDetail,
  ManagementServiceRegistrationItem,
  RejectServiceRegistrationRequest,
  ServiceRegistrationsPagedResult,
  ServiceRegistrationResult,
} from "@/types/service-registrations";

vi.mock("@/lib/axios-client", () => ({
  default: { post: vi.fn(), get: vi.fn() },
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

const mockDetail: ManagementServiceRegistrationDetail = {
  id: "sr-123",
  referenceCode: "SR-2026-000123",
  contactName: "Nguyen Van A",
  email: "owner@example.com",
  phoneNumber: "0901234567",
  businessName: "Kem IceBot",
  legalName: "Công ty TNHH Kem IceBot",
  taxCode: "0312345678",
  address: "Quận 1, TP.HCM",
  expectedLocationCount: 2,
  status: "UnderReview",
  revision: 3,
  message: "Muốn đặt 2 máy kiosk",
  privacyPolicyAccepted: true,
  privacyPolicyRevisionId: "b8387063-e4d0-4d51-aefc-f1797cfae4f2",
  submittedAt: "2026-08-17T04:00:00Z",
  createdAt: "2026-08-17T04:00:00Z",
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

describe("management service registration contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists management service registrations with query parameters", async () => {
    const pagedResult: ServiceRegistrationsPagedResult = {
      succeeded: true,
      statusCode: 200,
      data: [mockDetail],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    vi.mocked(axiosClient.get).mockResolvedValue({
      data: pagedResult,
    } as AxiosResponse);

    const result = await listManagementServiceRegistrations({
      status: "UnderReview",
      search: "Kem",
      pageNumber: 1,
      pageSize: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations",
      expect.objectContaining({
        params: {
          status: "UnderReview",
          search: "Kem",
          createdFrom: undefined,
          createdTo: undefined,
          pageNumber: 1,
          pageSize: 20,
        },
      }),
    );
  });

  it("fetches single registration detail by ID", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: mockDetail,
      },
    } as AxiosResponse);

    const detail = await getManagementServiceRegistration("sr-123");
    expect(detail.id).toBe("sr-123");
    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations/sr-123",
      { signal: undefined },
    );
  });

  it("starts review for a registration with expectedRevision", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: { ...mockDetail, status: "UnderReview" },
      },
    } as AxiosResponse);

    const updated = await startReviewServiceRegistration("sr-123", 2);
    expect(updated.status).toBe("UnderReview");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations/sr-123/start-review",
      { expectedRevision: 2 },
    );
  });

  it("approves registration with org creation command payload", async () => {
    const approvePayload: ApproveServiceRegistrationRequest = {
      organizationCode: "KEM-A",
      organizationName: "Kem A",
      adminUserName: "owner.kema",
      adminEmail: "owner@example.com",
      localLoginEnabled: true,
      googleLoginEnabled: true,
      expectedRevision: 3,
    };

    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: { ...mockDetail, status: "Approved" },
      },
    } as AxiosResponse);

    const updated = await approveServiceRegistration("sr-123", approvePayload);
    expect(updated.status).toBe("Approved");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations/sr-123/approve",
      approvePayload,
    );
  });

  it("rejects registration with reason and expectedRevision", async () => {
    const rejectPayload: RejectServiceRegistrationRequest = {
      reason: "Thông tin không chính xác",
      expectedRevision: 3,
    };

    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: { ...mockDetail, status: "Rejected", rejectionReason: "Thông tin không chính xác" },
      },
    } as AxiosResponse);

    const updated = await rejectServiceRegistration("sr-123", rejectPayload);
    expect(updated.status).toBe("Rejected");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations/sr-123/reject",
      rejectPayload,
    );
  });

  it("retries provisioning for a failed registration", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        succeeded: true,
        statusCode: 200,
        data: { ...mockDetail, status: "Approved" },
      },
    } as AxiosResponse);

    const updated = await retryProvisioningServiceRegistration("sr-123", 3);
    expect(updated.status).toBe("Approved");
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/service-registrations/sr-123/retry-provisioning",
      { expectedRevision: 3 },
    );
  });
});
