import type { LucideIcon } from "lucide-react";

import { MetricStripItem } from "@/components/shared/metric-strip";

type DashboardKpiTone = "neutral" | "primary" | "warning" | "destructive";

interface DashboardKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | null;
  description: string;
  href?: string;
  tone?: DashboardKpiTone;
}

export function DashboardKpiCard({
  icon: Icon,
  label,
  value,
  description,
  href,
  tone = "neutral",
}: DashboardKpiCardProps) {
  return (
    <MetricStripItem
      icon={Icon}
      label={label}
      value={value === null ? "—" : value.toLocaleString("vi-VN")}
      description={description}
      href={href}
      tone={tone}
    />
  );
}
