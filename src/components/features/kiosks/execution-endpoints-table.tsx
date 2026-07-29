"use client";

import { useState } from "react";
import { AlertTriangle, Network, Plus, RefreshCw } from "lucide-react";

import {
  EndpointLifecycleDialog,
  ExecutionEndpointCreateDialog,
} from "./device-management-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutionEndpoints } from "@/hooks/use-execution-endpoints";
import type { ExecutionEndpointResult } from "@/types/execution-endpoints";

function formatTimestamp(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function getEndpointStatusLabel(status: ExecutionEndpointResult["status"]) {
  return {
    Provisioning: "Chờ cấu hình",
    Active: "Đang hoạt động",
    Disabled: "Đã vô hiệu hóa",
    Retired: "Đã ngừng sử dụng",
  }[status];
}

export function ExecutionEndpointsTable({ kioskId, canManage }: { kioskId: string; canManage: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<{
    endpoint: ExecutionEndpointResult;
    action: "disable" | "reactivate" | "retire";
  } | null>(null);
  const management = useExecutionEndpoints(kioskId);
  const { items, isLoading, errorMessage, refresh } = management;

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="size-4 text-primary" />
              Điểm thực thi
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chỉ hiển thị trạng thái và bằng chứng sẵn sàng; không hiển thị thông tin xác thực.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage ? <Button size="sm" onClick={() => { management.clearMutationError(); setCreateOpen(true); }}><Plus className="size-4" />Tạo điểm thực thi</Button> : null}
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Đang tải điểm thực thi...
          </p>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Kiosk chưa có điểm thực thi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Endpoint</TableHead>
                  <TableHead className="text-center">Profile</TableHead>
                  <TableHead className="text-center">Vòng đời</TableHead>
                  <TableHead className="text-center">Sẵn sàng</TableHead>
                  <TableHead className="text-center">Hoạt động</TableHead>
                  <TableHead className="text-center">An toàn</TableHead>
                  <TableHead className="pr-5 text-right">Báo cáo lúc</TableHead>
                  {canManage ? <TableHead className="pr-5 text-right">Thao tác</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-5 font-mono text-xs font-medium">
                      {item.endpointCode}
                    </TableCell>
                    <TableCell className="text-center">{item.executionProfile}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{getEndpointStatusLabel(item.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.readiness ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.activity ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.readiness?.safety ?? "Chưa có"}
                    </TableCell>
                    <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                      {formatTimestamp(item.readiness?.executorReportedAt)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-5">
                        <div className="flex justify-end gap-1">
                          {item.status === "Active" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "disable" }); }}>Vô hiệu hóa</Button> : null}
                          {item.status === "Disabled" ? <Button size="sm" variant="outline" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "reactivate" }); }}>Kích hoạt lại</Button> : null}
                          {item.status === "Provisioning" || item.status === "Disabled" ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={management.isMutating} onClick={() => { management.clearMutationError(); setLifecycleAction({ endpoint: item, action: "retire" }); }}>Ngừng sử dụng</Button> : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {createOpen ? (
        <ExecutionEndpointCreateDialog
          open
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!management.isMutating) setCreateOpen(open); }}
          onSubmit={management.createEndpoint}
        />
      ) : null}
      {lifecycleAction ? (
        <EndpointLifecycleDialog
          endpoint={lifecycleAction.endpoint}
          action={lifecycleAction.action}
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!open && !management.isMutating) setLifecycleAction(null); }}
          onSubmit={() => management.setLifecycle(lifecycleAction.endpoint.id, lifecycleAction.action)}
        />
      ) : null}
    </Card>
  );
}
