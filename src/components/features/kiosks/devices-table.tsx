"use client";

import { AlertTriangle, Cpu, PackageSearch } from "lucide-react";

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
import { useDevices } from "@/hooks/use-devices";

interface DevicesTableProps {
  kioskId: string;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Active":
      return "default";
    case "Maintenance":
    case "Provisioning":
      return "secondary";
    case "Disabled":
    case "Retired":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "Provisioning":
      return "Đang cấu hình";
    case "Active":
      return "Đang hoạt động";
    case "Maintenance":
      return "Bảo trì";
    case "Disabled":
      return "Vô hiệu hóa";
    case "Retired":
      return "Ngừng sử dụng";
    default:
      return status;
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

export function DevicesTable({ kioskId }: DevicesTableProps) {
  const { state, devices, errorMessage, refresh } = useDevices(kioskId);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="size-4 text-primary" />
            Danh sách thiết bị
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Hiển thị {devices.length} thiết bị
          </span>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Mã thiết bị</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead className="pr-5">Cài đặt lúc</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {device.deviceTypeCode}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.deviceModelCode || "--"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {device.serialNumber || "--"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(device.status)}>
                        {getStatusLabel(device.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {device.firmwareVersion || "--"}
                    </TableCell>
                    <TableCell className="pr-5 tabular-nums text-xs text-muted-foreground">
                      {formatTimestamp(device.installedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
