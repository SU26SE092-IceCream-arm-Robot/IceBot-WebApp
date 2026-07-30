"use client";

import { useParams } from "next/navigation";

import { OrganizationProductionWorkspace } from "@/components/features/organizations/organization-production-workspace";

export default function OrganizationProductionPage() {
  const params = useParams<{ id: string }>();
  return <OrganizationProductionWorkspace organizationId={params.id} />;
}
