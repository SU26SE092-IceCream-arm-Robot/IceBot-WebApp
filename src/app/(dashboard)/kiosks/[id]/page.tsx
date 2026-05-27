"use client";

import { useParams } from "next/navigation";

import { KioskDetailView } from "@/components/features/kiosks/kiosk-detail-view";

export default function KioskDetailPage() {
  const params = useParams<{ id: string }>();

  return <KioskDetailView kioskId={params.id} />;
}
