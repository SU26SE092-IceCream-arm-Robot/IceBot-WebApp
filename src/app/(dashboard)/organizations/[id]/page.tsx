"use client";

import { useParams } from "next/navigation";

import { OrganizationDetailView } from "@/components/features/organizations/organization-detail-view";

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  return <OrganizationDetailView organizationId={params.id} />;
}
