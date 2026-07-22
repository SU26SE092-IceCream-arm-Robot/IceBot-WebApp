import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type {
  DashboardOverviewData,
  DashboardOverviewResult,
  GraphQLResponse,
} from "@/types/dashboard-overview";

const DASHBOARD_OVERVIEW_QUERY = `
  query DashboardOverview($orderTake: Int!) {
    dashboard {
      organizationCount
      storeCount
      kioskCount
      activeKioskCount
      offlineKioskCount
      maintenanceKioskCount
      pendingOrderCount
      paidOrderCount
      refundRequiredOrderCount
      lowStockDispenserCount
      latestDeviceEventCount
    }
    kioskStatusOverview {
      totalCount
      byLifecycleStatus {
        status
        count
      }
      byConnectivityStatus {
        status
        count
      }
      items {
        kioskId
        kioskCode
        kioskName
        organizationId
        storeId
        storeName
        lifecycleStatus
        connectivityStatus
        lastHeartbeatAt
        lastEventSeverity
        lastEventAt
      }
    }
    inventorySummary {
      totalDispenserCount
      lowStockCount
      emptyCount
      items {
        dispenserStateId
        kioskId
        kioskCode
        ingredientName
        estimatedQuantity
        capacity
        unit
        status
        updatedAt
      }
    }
    orderOverview(take: $orderTake) {
      totalCount
      byStatus {
        status
        count
      }
      recentOrders {
        orderId
        orderNumber
        kioskId
        kioskCode
        status
        paymentStatus
        totalAmount
        createdAt
        customerStatus
        customerStatusMessage
        requiresStaffSupport
      }
    }
  }
`;

export async function getDashboardOverview(
  signal?: AbortSignal,
): Promise<DashboardOverviewResult> {
  const response = await axiosClient.post<GraphQLResponse<DashboardOverviewData>>(
    "/graphql",
    {
      query: DASHBOARD_OVERVIEW_QUERY,
      variables: { orderTake: 8 },
    },
    { signal },
  );

  const warnings =
    response.data.errors?.map((error) => error.message).filter(Boolean) ?? [];

  if (!response.data.data) {
    throw new Error(
      warnings.join(" ") || "Backend không trả về dữ liệu tổng quan.",
    );
  }

  return {
    data: response.data.data,
    warnings,
  };
}

export function getDashboardOverviewErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) {
    return "";
  }

  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Không thể tải dữ liệu tổng quan."
    );
  }

  return error instanceof Error
    ? error.message
    : "Không thể tải dữ liệu tổng quan.";
}
