import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFranchiseOnboarding } from "@/hooks/use-franchise-onboarding";
import { useNotificationDeliveries } from "@/hooks/use-notification-deliveries";
import {
  listFranchiseOnboardings,
  startFranchiseOnboarding,
} from "@/lib/services/franchise-onboarding";
import {
  listNotificationDeliveries,
  requeueNotificationDelivery,
} from "@/lib/services/notification-deliveries";
import type { FranchiseOnboardingResult } from "@/types/franchise-onboarding";
import type { NotificationDeliveryResult } from "@/types/notification-deliveries";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/services/franchise-onboarding", () => ({
  listFranchiseOnboardings: vi.fn(),
  startFranchiseOnboarding: vi.fn(),
  resumeFranchiseOnboarding: vi.fn(),
  cancelFranchiseOnboarding: vi.fn(),
  getFranchiseOnboardingErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể thiết lập điểm bán.") => fallback,
  ),
}));
vi.mock("@/lib/services/notification-deliveries", () => ({
  listNotificationDeliveries: vi.fn(),
  requeueNotificationDelivery: vi.fn(),
  getNotificationDeliveryErrorMessage: vi.fn(
    (_error: unknown, fallback = "Không thể xử lý thông báo.") => fallback,
  ),
}));

const pagination = {
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};
const onboarding = {
  id: "onboarding-1",
  organizationId: "org-1",
  status: "Running",
} as FranchiseOnboardingResult;
const delivery = {
  id: "delivery-1",
  organizationId: "org-1",
  status: "PermanentFailure",
} as NotificationDeliveryResult;

describe("OrgAdmin governance mutation recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFranchiseOnboardings).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    });
    vi.mocked(listNotificationDeliveries).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    });
  });

  it("keeps onboarding success and retries only the failed read", async () => {
    vi.mocked(startFranchiseOnboarding).mockResolvedValue(onboarding);
    const { result } = renderHook(() =>
      useFranchiseOnboarding("org-1", true),
    );
    await waitFor(() =>
      expect(listFranchiseOnboardings).toHaveBeenCalledOnce(),
    );
    vi.mocked(listFranchiseOnboardings)
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce({
        succeeded: true,
        statusCode: 200,
        data: [onboarding],
        pagination: { ...pagination, totalCount: 1, totalPages: 1 },
      });

    await act(async () => {
      await result.current.start({
        store: {
          code: "STORE-01",
          name: "Store 01",
          storeType: "Retail",
          timeZone: "Asia/Ho_Chi_Minh",
          openingHours: [],
        },
        kiosk: {
          code: "KIOSK-01",
          name: "Kiosk 01",
          kioskType: "RoboticVending",
          timeZone: "Asia/Ho_Chi_Minh",
        },
      });
    });

    expect(startFranchiseOnboarding).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Đã bắt đầu thiết lập điểm bán.");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).toContain("đã thành công");

    await act(async () => {
      await result.current.retryRefresh();
    });
    expect(startFranchiseOnboarding).toHaveBeenCalledOnce();
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("keeps requeue success and retries only the failed delivery list", async () => {
    vi.mocked(requeueNotificationDelivery).mockResolvedValue(delivery);
    const { result } = renderHook(() =>
      useNotificationDeliveries("org-1", true),
    );
    await waitFor(() =>
      expect(listNotificationDeliveries).toHaveBeenCalledOnce(),
    );
    vi.mocked(listNotificationDeliveries)
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce({
        succeeded: true,
        statusCode: 200,
        data: [delivery],
        pagination: { ...pagination, totalCount: 1, totalPages: 1 },
      });

    await act(async () => {
      await result.current.requeue("delivery-1", "Nhà cung cấp đã phục hồi");
    });

    expect(requeueNotificationDelivery).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith(
      "Đã đưa thông báo vào hàng đợi lại.",
    );
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).toContain("đã thành công");

    await act(async () => {
      await result.current.retryRefresh();
    });
    expect(requeueNotificationDelivery).toHaveBeenCalledOnce();
    expect(result.current.refreshWarningMessage).toBeNull();
  });
});
