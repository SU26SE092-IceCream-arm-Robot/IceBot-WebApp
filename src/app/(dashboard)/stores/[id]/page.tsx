"use client";

import { useParams } from "next/navigation";

import { StoreDetailView } from "@/components/features/organizations/store-detail-view";

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  return <StoreDetailView storeId={params.id} />;
}
