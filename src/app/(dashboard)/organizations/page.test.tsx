import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationsPage from "./page";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/identity/use-auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock(
  "@/components/features/tenants/organizations/organizations-view",
  () => ({ OrganizationsView: () => <div>organization-list</div> }),
);

vi.mock(
  "@/components/features/tenants/organizations/organization-detail-view",
  () => ({
    OrganizationDetailView: ({
      organizationId,
      showOrganizationListLink,
    }: {
      organizationId: string;
      showOrganizationListLink?: boolean;
    }) => (
      <div>
        organization-detail:{organizationId}:
        {String(showOrganizationListLink)}
      </div>
    ),
  }),
);

describe("OrganizationsPage", () => {
  beforeEach(() => {
    mocks.useAuth.mockReset();
  });

  it("keeps the organization list for SystemAdmin", () => {
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      effectiveAccess: {
        isSystemAdmin: true,
        roles: ["SystemAdmin"],
        roleScopes: [],
        effectiveScope: { organizationIds: [], storeIds: [], kioskIds: [] },
      },
    });

    render(<OrganizationsPage />);

    expect(screen.getByText("organization-list")).toBeInTheDocument();
  });

  it("opens the assigned organization directly for OrgAdmin", () => {
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      effectiveAccess: {
        isSystemAdmin: false,
        roles: ["OrgAdmin"],
        roleScopes: [
          { roleCode: "OrgAdmin", organizationId: "organization-1" },
        ],
        effectiveScope: {
          organizationIds: ["organization-1"],
          storeIds: [],
          kioskIds: [],
        },
      },
    });

    render(<OrganizationsPage />);

    expect(
      screen.getByText("organization-detail:organization-1:false"),
    ).toBeInTheDocument();
    expect(screen.queryByText("organization-list")).not.toBeInTheDocument();
  });

  it("does not apply the direct-detail behavior to other roles", () => {
    mocks.useAuth.mockReturnValue({
      status: "authenticated",
      effectiveAccess: {
        isSystemAdmin: false,
        roles: ["Manager"],
        roleScopes: [
          { roleCode: "Manager", organizationId: "organization-1" },
        ],
        effectiveScope: {
          organizationIds: ["organization-1"],
          storeIds: [],
          kioskIds: [],
        },
      },
    });

    render(<OrganizationsPage />);

    expect(screen.getByText("organization-list")).toBeInTheDocument();
  });
});
