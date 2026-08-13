import axiosClient from "@/lib/axios-client";
import { unwrapPagedApiResult } from "@/lib/api/result";
import type {
  OrganizationSalesPage,
  OrganizationSalesQuery,
} from "@/types/platform/organization-sales";

const organizationSalesPath = "/api/v1/management/organizations/sales-summaries";

export async function listOrganizationSalesSummaries(
  query: OrganizationSalesQuery,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get<OrganizationSalesPage>(organizationSalesPath, {
    params: {
      from: query.from,
      to: query.to,
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.search?.trim() ? { search: query.search.trim() } : {}),
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
    signal,
  });

  return unwrapPagedApiResult(
    response.data,
    "Không thể tải doanh thu tổng hợp theo tổ chức.",
  );
}
