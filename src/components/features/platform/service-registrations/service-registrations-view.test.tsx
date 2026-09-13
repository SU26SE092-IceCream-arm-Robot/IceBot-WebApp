import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceRegistrationsView } from "@/components/features/platform/service-registrations/service-registrations-view";
import { ServiceRegistrationApproveDialog } from "@/components/features/platform/service-registrations/service-registration-approve-dialog";
import {
  getPrivacyPolicyAcceptanceLabel,
  getServiceRegistrationStatusLabel,
} from "@/components/features/platform/service-registrations/service-registration-detail-drawer";
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
  createdAt: "2026-08-17T04:00:00Z",
};

describe("service registration presentation", () => {
  it("distinguishes every provisioning state", () => {
    expect(getServiceRegistrationStatusLabel("Provisioning")).toBe(
      "Đang cấp phát",
    );
    expect(getServiceRegistrationStatusLabel("ProvisioningFailed")).toBe(
      "Lỗi cấp phát",
    );
    expect(getServiceRegistrationStatusLabel("Provisioned")).toBe(
      "Đã cấp phát",
    );
  });

  it("uses the required policy revision when the API omits the legacy boolean", () => {
    expect(
      getPrivacyPolicyAcceptanceLabel({
        privacyPolicyRevisionId: "policy-revision-id",
      }),
    ).toBe("Đã đồng ý");
    expect(
      getPrivacyPolicyAcceptanceLabel({
        privacyPolicyAccepted: false,
        privacyPolicyRevisionId: "policy-revision-id",
      }),
    ).toBe("Chưa đồng ý");
    expect(
      getPrivacyPolicyAcceptanceLabel({ privacyPolicyRevisionId: "" }),
    ).toBe("Không xác định");
  });
});

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

    vi.mocked(
      serviceModule.listManagementServiceRegistrations,
    ).mockResolvedValue(paged);

    render(<ServiceRegistrationsView />);

    expect((await screen.findAllByText("SR-2026-0001")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Nguyen Van A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kem A").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chờ rà soát/i).length).toBeGreaterThanOrEqual(
      1,
    );
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

    vi.mocked(
      serviceModule.listManagementServiceRegistrations,
    ).mockResolvedValue(paged);
    vi.mocked(serviceModule.getManagementServiceRegistration).mockResolvedValue(
      mockItem,
    );

    render(<ServiceRegistrationsView />);

    const [refLink] = await screen.findAllByRole("button", {
      name: "SR-2026-0001",
    });
    fireEvent.click(refLink);

    await waitFor(() => {
      expect(screen.getByText(/Thông tin cơ sở & Quy mô/i)).toBeInTheDocument();
      expect(screen.getByText("Công ty Kem A")).toBeInTheDocument();
    });
  });

  it("uses the policy revision as acceptance evidence when the API omits the legacy boolean", async () => {
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
    const detailWithoutAcceptanceBoolean = {
      ...mockItem,
      privacyPolicyAccepted: undefined,
    };

    vi.mocked(
      serviceModule.listManagementServiceRegistrations,
    ).mockResolvedValue(paged);
    vi.mocked(serviceModule.getManagementServiceRegistration).mockResolvedValue(
      detailWithoutAcceptanceBoolean,
    );

    render(<ServiceRegistrationsView />);

    const [refLink] = await screen.findAllByRole("button", {
      name: "SR-2026-0001",
    });
    fireEvent.click(refLink);

    expect(await screen.findByText("Đã đồng ý")).toBeInTheDocument();
    expect(screen.queryByText("Chưa đồng ý")).not.toBeInTheDocument();
  });

  it("uses business-facing approval wording and explains the internal reference", () => {
    render(
      <ServiceRegistrationApproveDialog
        open
        onOpenChange={vi.fn()}
        item={mockItem}
        loading={false}
        onApprove={vi.fn()}
      />,
    );

    expect(screen.getByText("Mã hồ sơ đăng ký:")).toBeInTheDocument();
    expect(
      screen.getByText("Dùng để tra cứu và đối chiếu nội bộ."),
    ).toBeInTheDocument();
    expect(screen.getByText("Tài khoản Quản trị viên tổ chức")).toBeInTheDocument();
    expect(screen.queryByText(/OrgAdmin/)).not.toBeInTheDocument();
  });
});
