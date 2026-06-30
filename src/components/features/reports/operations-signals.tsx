import { Boxes, ClipboardList, PackageSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <Card key={panel.id} className="rounded-xl border border-border bg-card shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <CardTitle>{panel.title}</CardTitle>
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
