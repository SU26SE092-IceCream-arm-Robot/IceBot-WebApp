"use client";

import { AlertTriangle, Boxes, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductionPackageCatalog } from "@/hooks/production/use-production-package-catalog";

export function ProductionPackageCatalogPanel({
  organizationId,
  canRead,
}: {
  organizationId: string;
  canRead: boolean;
}) {
  const { packages, isLoading, error, refresh } = useProductionPackageCatalog(
    organizationId,
    canRead,
  );

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Boxes className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Danh mục gói sản xuất</CardTitle>
            <CardDescription className="mt-1">
              Các gói cấu hình có thể được cài đặt cho tổ chức đã chọn.
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={isLoading} onClick={() => void refresh()}>
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            <div className="h-12 animate-pulse rounded-md bg-muted" />
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>Thử lại</Button>
          </div>
        ) : packages.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Chưa có gói sản xuất nào trong danh mục này.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {packages.map((item) => (
              <article key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.code}</p>
                  {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
                </div>
                <div className="text-left text-sm sm:text-right">
                  <p className="font-medium text-foreground">{item.versions.length} phiên bản</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Trạng thái: {item.status}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
