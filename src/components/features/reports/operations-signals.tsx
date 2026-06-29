import { Boxes, ClipboardList, PackageSearch } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportSignalPanel } from "@/types/reports";

const ICONS = { catalog: PackageSearch, inventory: Boxes, operations: ClipboardList };
const VALUE_TONES = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export function OperationsSignals({ panels }: { panels: ReportSignalPanel[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {panels.map((panel) => {
        const Icon = ICONS[panel.id];
        const unavailable = panel.coverage.every((item) => item.status === "skipped" || item.status === "failed");
        return (
          <Card key={panel.id} className="gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none">
            <CardHeader className="border-b border-border/70 bg-muted/5 px-5 py-4">
              <div className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="space-y-0.5">
                  <CardTitle>{panel.title}</CardTitle>
                  <CardDescription>{panel.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {unavailable ? (
                <p className="text-sm leading-6 text-muted-foreground">Nguồn dữ liệu này không khả dụng với vai trò hiện tại hoặc đang gặp lỗi.</p>
              ) : (
                panel.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`tabular-nums text-base font-semibold ${VALUE_TONES[item.tone]}`}>{item.value.toLocaleString("vi-VN")}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
