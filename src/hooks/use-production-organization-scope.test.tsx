import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductionOrganizationScope } from "@/hooks/use-production-organization-scope";
import { listManagementOrganizations } from "@/lib/services/organizations";
import type { OrganizationResult } from "@/types/tenant-management";

vi.mock("@/lib/services/organizations", () => ({
  getOrganizationsErrorMessage: vi.fn(
    (_: unknown, fallback: string) => fallback,
  ),
  listManagementOrganizations: vi.fn(),
}));

function organization(id: string, code: string): OrganizationResult {
  return {
    id,
    code,
    name: `Organization ${code}`,
    status: "Active",
    createdAt: "2026-08-01T00:00:00Z",
  };
}

function page(
  items: OrganizationResult[],
  options?: {
    page?: number;
    totalCount?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  },
) {
  return {
    succeeded: true,
    statusCode: 200,
    data: items,
    pagination: {
      page: options?.page ?? 1,
      pageSize: 25,
      totalCount: options?.totalCount ?? items.length,
      totalPages: options?.hasNext ? 2 : 1,
      hasNext: options?.hasNext ?? false,
      hasPrevious: options?.hasPrevious ?? false,
    },
  } as never;
}

describe("useProductionOrganizationScope", () => {
  beforeEach(() => vi.mocked(listManagementOrganizations).mockReset());

  it("uses server search and a bounded page instead of a capped organization list", async () => {
    vi.mocked(listManagementOrganizations)
      .mockResolvedValueOnce(
        page([organization("org-1", "ONE")], {
          totalCount: 101,
          hasNext: true,
        }),
      )
      .mockResolvedValueOnce(
        page([organization("org-101", "MATCH")], { totalCount: 1 }),
      );

    const { result } = renderHook(() => useProductionOrganizationScope());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listManagementOrganizations).toHaveBeenCalledWith(
      { pageNumber: 1, pageSize: 25, search: "" },
      expect.any(AbortSignal),
    );

    act(() => result.current.setSearch("MATCH"));
    await waitFor(() =>
      expect(listManagementOrganizations).toHaveBeenLastCalledWith(
        { pageNumber: 1, pageSize: 25, search: "MATCH" },
        expect.any(AbortSignal),
      ),
    );
    expect(result.current.organizations[0]?.id).toBe("org-101");
  });

  it("keeps the chosen organization while its search page changes", async () => {
    const selected = organization("org-1", "ONE");
    vi.mocked(listManagementOrganizations)
      .mockResolvedValueOnce(
        page([selected, organization("org-2", "TWO")], { totalCount: 2 }),
      )
      .mockResolvedValueOnce(
        page([organization("org-3", "THREE")], { totalCount: 1 }),
      );

    const { result } = renderHook(() => useProductionOrganizationScope());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectOrganization(selected));
    act(() => result.current.setSearch("THREE"));
    await waitFor(() =>
      expect(result.current.organizations[0]?.id).toBe("org-3"),
    );

    expect(result.current.selectedOrganizationId).toBe("org-1");
  });
});
