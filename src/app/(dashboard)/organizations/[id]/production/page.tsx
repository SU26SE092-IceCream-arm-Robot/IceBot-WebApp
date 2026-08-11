"use client";

import { useParams } from "next/navigation";

import { OrganizationProductionWorkspace } from "@/components/features/tenants/organizations/organization-production-workspace";

export default function OrganizationProductionPage() {
  const params = useParams<{ id: string }>();
  return <OrganizationProductionWorkspace organizationId={params.id} />;
}
