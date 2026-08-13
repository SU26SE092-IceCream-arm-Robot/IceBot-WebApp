import axios from "axios";

import axiosClient from "@/lib/axios-client";
import type {
  DashboardOverviewData,
  DashboardOverviewResult,
  GraphQLResponse,
} from "@/types/dashboard/overview";

const DASHBOARD_CORE_SELECTION = `
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
`;

const ORDER_OVERVIEW_SELECTION = `
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
`;

function buildDashboardOverviewQuery(includeOrderOverview: boolean): string {
  return `
  query DashboardOverview${includeOrderOverview ? "($orderTake: Int!)" : ""} {
${DASHBOARD_CORE_SELECTION}
${includeOrderOverview ? ORDER_OVERVIEW_SELECTION : ""}
  }
`;
}

export async function getDashboardOverview(
  signal?: AbortSignal,
  options: { includeOrderOverview?: boolean } = {},
): Promise<DashboardOverviewResult> {
  const includeOrderOverview = options.includeOrderOverview ?? false;
  const response = await axiosClient.post<GraphQLResponse<DashboardOverviewData>>(
    "/graphql",
    {
      query: buildDashboardOverviewQuery(includeOrderOverview),
      variables: includeOrderOverview ? { orderTake: 8 } : {},
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

  const hasUsableRoot = Object.values(response.data.data).some(
    (root) => root !== null && root !== undefined,
  );

  if (!hasUsableRoot) {
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
