"use client";

import { useState } from "react";
import { AlertTriangle, Cpu, PackageSearch, Pencil, Plus, Power, Replace, Trash2 } from "lucide-react";

import {
  DeviceFormDialog,
  DeviceStatusDialog,
  getDeviceStatusLabel,
  RetireDeviceDialog,
  ReplaceDeviceDialog,
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
import { useDevices } from "@/hooks/kiosks/use-devices";
import type { DeviceResult } from "@/types/kiosks/devices";

interface DevicesTableProps {
  kioskId: string;
  canManage: boolean;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Online":
      return "default";
    case "Maintenance":
    case "Provisioning":
      return "secondary";
    case "Error":
      return "destructive";
    case "Offline":
    case "Disabled":
    case "Retired":
      return "outline";
    default:
      return "outline";
  }
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function EmptyState({ title, message, isError = false, onRetry }: { title: string; message: string; isError?: boolean; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className={`mb-4 flex size-14 items-center justify-center rounded-full border ${isError ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-border bg-muted/20 text-muted-foreground'} shadow-sm`}>
        {isError ? <AlertTriangle className="size-6" /> : <PackageSearch className="size-6 opacity-70" />}
      </span>
      <div className="max-w-md space-y-1.5 mb-4">
        <p className={`text-base font-semibold tracking-tight ${isError ? 'text-destructive' : 'text-foreground'}`}>{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant={isError ? "destructive" : "outline"} onClick={onRetry} size="sm">
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function DevicesTable({ kioskId, canManage }: DevicesTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceResult | null>(null);
  const [statusDevice, setStatusDevice] = useState<DeviceResult | null>(null);
  const [retireDevice, setRetireDevice] = useState<DeviceResult | null>(null);
  const [replacementSource, setReplacementSource] = useState<DeviceResult | null>(null);
  const management = useDevices(kioskId);
  const { state, devices, errorMessage, refresh } = management;

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="size-4 text-primary" />
            Danh sách thiết bị
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Hiển thị {devices.length} thiết bị</span>
            {canManage ? (
              <Button size="sm" onClick={() => { management.clearMutationError(); setEditingDevice(null); setFormOpen(true); }}>
                <Plus className="size-4" />
                Tạo thiết bị
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {state === "LOADING" ? (
          <EmptyState title="Đang tải danh sách thiết bị" message="Vui lòng đợi trong giây lát..." />
        ) : state === "ERROR" ? (
          <EmptyState 
            isError 
            title="Không tải được thiết bị" 
            message={errorMessage || "Đã xảy ra lỗi hệ thống"} 
            onRetry={() => refresh()}
          />
        ) : devices.length === 0 ? (
          <EmptyState 
            title="Chưa có thiết bị nào" 
            message="Kiosk này chưa được gán bất kỳ thiết bị phần cứng nào từ hệ thống." 
            onRetry={() => refresh()}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1040px] table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Mã thiết bị</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead className="text-center">Loại</TableHead>
                  <TableHead className="text-center">Model</TableHead>
                  <TableHead className="text-center">Serial</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Firmware</TableHead>
                  <TableHead className="pr-5 text-center">Cài đặt lúc</TableHead>
                  {canManage ? <TableHead className="pr-5 text-right">Thao tác</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="pl-5 font-mono text-xs font-medium text-foreground">
                      {device.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.name}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {device.deviceTypeCode}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {device.deviceModelCode || "--"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {device.serialNumber || "--"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge variant={getStatusVariant(device.status)}>
                          {getDeviceStatusLabel(device.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {device.firmwareVersion || "--"}
                    </TableCell>
                    <TableCell className="pr-5 text-center tabular-nums text-xs text-muted-foreground">
                      {formatTimestamp(device.installedAt)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Chỉnh sửa thiết bị" aria-label={`Chỉnh sửa ${device.name}`} disabled={management.isMutating || device.status === "Retired"} onClick={() => { management.clearMutationError(); setEditingDevice(device); setFormOpen(true); }}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" title="Đổi trạng thái thiết bị" aria-label={`Đổi trạng thái ${device.name}`} disabled={management.isMutating || device.status === "Retired"} onClick={() => { management.clearMutationError(); setStatusDevice(device); }}><Power className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" title="Thay bằng thiết bị khác" aria-label={`Thay thiết bị ${device.name}`} disabled={management.isMutating || device.status === "Retired"} onClick={() => { management.clearMutationError(); setReplacementSource(device); }}><Replace className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Ngừng sử dụng thiết bị" aria-label={`Ngừng sử dụng ${device.name}`} disabled={management.isMutating || device.status === "Retired"} onClick={() => { management.clearMutationError(); setRetireDevice(device); }}><Trash2 className="size-4" /></Button>
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

      {formOpen ? (
        <DeviceFormDialog
          open
          device={editingDevice}
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!management.isMutating) setFormOpen(open); }}
          onCreate={management.createDevice}
          onUpdate={management.updateDevice}
        />
      ) : null}
      {statusDevice ? (
        <DeviceStatusDialog
          device={statusDevice}
          open
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!open && !management.isMutating) setStatusDevice(null); }}
          onSubmit={(status) => management.setDeviceStatus(statusDevice.id, status)}
        />
      ) : null}
      {retireDevice ? (
        <RetireDeviceDialog
          device={retireDevice}
          open
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!open && !management.isMutating) setRetireDevice(null); }}
          onSubmit={(reason) => management.retireDevice(retireDevice.id, reason)}
        />
      ) : null}
      {replacementSource ? (
        <ReplaceDeviceDialog
          device={replacementSource}
          candidates={devices.filter((item) => item.id !== replacementSource.id && item.status !== "Retired")}
          isSubmitting={management.isMutating}
          errorMessage={management.mutationErrorMessage}
          onOpenChange={(open) => { if (!open && !management.isMutating) setReplacementSource(null); }}
          onSubmit={(replacementDeviceId, reason) => management.replaceDevice(replacementSource.id, replacementDeviceId, reason)}
        />
      ) : null}
    </Card>
  );
}
