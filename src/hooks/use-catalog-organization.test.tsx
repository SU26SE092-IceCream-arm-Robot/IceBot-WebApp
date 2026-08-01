import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCatalogOrganization } from "@/hooks/use-catalog-organization";

const mocks = vi.hoisted(() => ({
  getRoleScopeOptions: vi.fn(),
  listManagementOrganizations: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("@/lib/services/organizations", () => ({
  getOrganizationsErrorMessage: (_error: unknown, fallback: string) => fallback,
  listManagementOrganizations: mocks.listManagementOrganizations,
}));

vi.mock("@/lib/services/roles", () => ({
  getRoleScopeOptions: mocks.getRoleScopeOptions,
}));

describe("useCatalogOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["OrgAdmin", "Manager"])(
    "loads named organization scope for %s without exposing an id-only option",
    async (roleCode) => {
      mocks.useAuth.mockReturnValue({
        status: "authenticated",
        session: {
          account: {
            roles: [{ roleCode, organizationId: "org-1" }],
          },
        },
      });
      mocks.getRoleScopeOptions.mockResolvedValue({
        roleCode,
        allowedScopeTypes: ["Organization"],
        requiresScope: true,
        organizations: [
          {
            id: "org-1",
            code: "ICEBOT-DEMO",
            name: "IceBot Demo Organization",
            stores: [],
          },
        ],
      });

      const { result } = renderHook(() => useCatalogOrganization());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mocks.getRoleScopeOptions).toHaveBeenCalledWith(
        roleCode,
        expect.any(AbortSignal),
      );
      expect(result.current.organizations).toEqual([
        {
          id: "org-1",
          code: "ICEBOT-DEMO",
          name: "IceBot Demo Organization",
        },
      ]);
      expect(result.current.selectedOrganizationId).toBe("org-1");
      expect(mocks.listManagementOrganizations).not.toHaveBeenCalled();
    },
  );
});
