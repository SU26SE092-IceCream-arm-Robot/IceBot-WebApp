"use client";

import { OrganizationDetailView } from "@/components/features/tenants/organizations/organization-detail-view";
import { OrganizationsView } from "@/components/features/tenants/organizations/organizations-view";
import { TenantLoadingState } from "@/components/features/tenants/shared/tenant-ui";
import { useAuth } from "@/hooks/identity/use-auth";

export default function OrganizationsPage() {
  const { status, effectiveAccess } = useAuth();

  if (status === "loading") {
    return <TenantLoadingState label="Đang xác định phạm vi tổ chức..." />;
  }

  if (!effectiveAccess || effectiveAccess.isSystemAdmin) {
    return <OrganizationsView />;
  }

  const isOrganizationAdmin = [
    ...effectiveAccess.roles,
    ...effectiveAccess.roleScopes.map((scope) => scope.roleCode),
  ].some((role) => role.toLocaleLowerCase() === "orgadmin");

  if (!isOrganizationAdmin) {
    return <OrganizationsView />;
  }

  const scopedOrganizationIds = Array.from(
    new Set(
      effectiveAccess.roleScopes
        .filter(
          (scope) => scope.roleCode.toLocaleLowerCase() === "orgadmin",
        )
        .map((scope) => scope.organizationId)
        .filter((organizationId): organizationId is string =>
          Boolean(organizationId),
        ),
    ),
  );
  const organizationIds =
    scopedOrganizationIds.length > 0
      ? scopedOrganizationIds
      : effectiveAccess.effectiveScope.organizationIds;

  if (organizationIds.length === 1) {
    return (
      <OrganizationDetailView
        organizationId={organizationIds[0]}
        showOrganizationListLink={false}
      />
    );
  }

  return <OrganizationsView />;
}
