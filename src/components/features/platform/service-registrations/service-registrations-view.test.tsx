import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceRegistrationsView } from "@/components/features/platform/service-registrations/service-registrations-view";
import * as serviceModule from "@/lib/services/service-registrations";
import type {
  ManagementServiceRegistrationDetail,
  ServiceRegistrationsPagedResult,
} from "@/types/service-registrations";

vi.mock("@/lib/services/service-registrations", () => ({
  listManagementServiceRegistrations: vi.fn(),
  getManagementServiceRegistration: vi.fn(),
  startReviewServiceRegistration: vi.fn(),
  approveServiceRegistration: vi.fn(),
  rejectServiceRegistration: vi.fn(),
  retryProvisioningServiceRegistration: vi.fn(),
  getServiceRegistrationErrorMessage: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : "Thao tác thất bại",
  ),
}));

const mockItem: ManagementServiceRegistrationDetail = {
  id: "sr-1",
  referenceCode: "SR-2026-0001",
  contactName: "Nguyen Van A",
  email: "owner@kema.vn",
  phoneNumber: "0901234567",
  businessName: "Kem A",
  legalName: "Công ty Kem A",
  taxCode: "0312345678",
  address: "Quận 1, TP.HCM",
  expectedLocationCount: 2,
  status: "Submitted",
  revision: 1,
  message: "Test registration",
  privacyPolicyAccepted: true,
  privacyPolicyRevisionId: "b8387063-e4d0-4d51-aefc-f1797cfae4f2",
  submittedAt: "2026-08-17T04:00:00Z",
  createdAt: "2026-08-17T04:00:00Z",
};

describe("ServiceRegistrationsView component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders registrations list and filters", async () => {
    const paged: ServiceRegistrationsPagedResult = {
      succeeded: true,
      statusCode: 200,
      data: [mockItem],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    vi.mocked(serviceModule.listManagementServiceRegistrations).mockResolvedValue(paged);

    render(<ServiceRegistrationsView />);

    expect(await screen.findByText("SR-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
    expect(screen.getByText("Kem A")).toBeInTheDocument();
    expect(screen.getAllByText(/Chờ rà soát/i).length).toBeGreaterThanOrEqual(1);
  });

  it("opens detail drawer when clicking on item reference code", async () => {
    const paged: ServiceRegistrationsPagedResult = {
      succeeded: true,
      statusCode: 200,
      data: [mockItem],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };

    vi.mocked(serviceModule.listManagementServiceRegistrations).mockResolvedValue(paged);
    vi.mocked(serviceModule.getManagementServiceRegistration).mockResolvedValue(mockItem);

    render(<ServiceRegistrationsView />);

    const refLink = await screen.findByRole("button", { name: "SR-2026-0001" });
    fireEvent.click(refLink);

    await waitFor(() => {
      expect(screen.getByText(/Thông tin cơ sở & Quy mô/i)).toBeInTheDocument();
      expect(screen.getByText("Công ty Kem A")).toBeInTheDocument();
    });
  });
});
