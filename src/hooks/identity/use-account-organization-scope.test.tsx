import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAccountOrganizationScope } from "@/hooks/identity/use-account-organization-scope";
import { listManagementOrganizations } from "@/lib/services/tenants/organizations";
import type { OrganizationResult } from "@/types/tenants/management";

vi.mock("@/lib/services/tenants/organizations", () => ({
  getOrganizationsErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listManagementOrganizations: vi.fn(),
}));

function organization(id: string, code: string): OrganizationResult {
  return {
    id,
    code,
    name: `Organization ${code}`,
    isActive: true,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  } as OrganizationResult;
}

function organizationPage(items: OrganizationResult[]) {
  return {
    succeeded: true,
    statusCode: 200,
    data: items,
    pagination: {
      page: 1,
      pageSize: 100,
      totalCount: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      hasNext: false,
      hasPrevious: false,
    },
  };
}

describe("useAccountOrganizationScope", () => {
  beforeEach(() => {
    vi.mocked(listManagementOrganizations).mockReset();
  });

  it("automatically selects the only organization in scope", async () => {
    const onlyOrganization = organization("org-1", "ORG-1");
    vi.mocked(listManagementOrganizations).mockResolvedValue(
      organizationPage([onlyOrganization]),
    );

    const { result } = renderHook(() => useAccountOrganizationScope());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedOrganizationId).toBe(onlyOrganization.id);
    expect(result.current.selectedOrganization).toEqual(onlyOrganization);
  });

  it("requires an explicit selection when multiple organizations are available", async () => {
    const organizations = [
      organization("org-1", "ORG-1"),
      organization("org-2", "ORG-2"),
    ];
    vi.mocked(listManagementOrganizations).mockResolvedValue(
      organizationPage(organizations),
    );

    const { result } = renderHook(() => useAccountOrganizationScope());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedOrganizationId).toBeNull();

    act(() => result.current.setSelectedOrganizationId("org-2"));
    expect(result.current.selectedOrganization?.code).toBe("ORG-2");
  });
});
