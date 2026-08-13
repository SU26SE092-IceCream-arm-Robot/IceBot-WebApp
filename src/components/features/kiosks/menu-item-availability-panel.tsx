"use client";

import { useState } from "react";
import { AlertTriangle, CirclePause, CirclePlay, RefreshCw, Search, Utensils } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMenuItemAvailability } from "@/hooks/kiosks/use-menu-item-availability";
import type {
  KioskMenuItemAvailabilityResult,
  MenuItemOperationalAvailabilityReasonCode,
} from "@/types/kiosks/menu-item-availability";

const REASONS: Array<{ value: MenuItemOperationalAvailabilityReasonCode; label: string }> = [
  { value: "OutOfStock", label: "Hết nguyên liệu" },
  { value: "EquipmentFault", label: "Thiết bị gặp sự cố" },
  { value: "QualityIssue", label: "Vấn đề chất lượng" },
  { value: "Cleaning", label: "Đang vệ sinh" },
  { value: "ManualPause", label: "Tạm dừng thủ công" },
  { value: "Other", label: "Lý do khác" },
];

export function MenuItemAvailabilityPanel({ kioskId, kioskName }: { kioskId: string; kioskName?: string }) {
  const availability = useMenuItemAvailability(kioskId, true);
  const [pendingItem, setPendingItem] = useState<KioskMenuItemAvailabilityResult | null>(null);
  const [reasonCode, setReasonCode] = useState<MenuItemOperationalAvailabilityReasonCode>("ManualPause");
  const [reason, setReason] = useState("");
  const isPausing = pendingItem?.state === "Available";
  const selectedReasonLabel = REASONS.find((option) => option.value === reasonCode)?.label;

  async function confirmChange() {
    if (!pendingItem) return;
    const succeeded = await availability.update(pendingItem, {
      state: isPausing ? "Paused" : "Available",
      reasonCode: isPausing ? reasonCode : "ManualPause",
      reason: isPausing ? reason.trim() || null : "Mở bán lại bởi người vận hành.",
    });
    if (succeeded) {
      toast.success(isPausing ? "Đã tạm dừng bán món tại kiosk." : "Đã mở bán lại món tại kiosk.");
      setPendingItem(null);
      setReason("");
      setReasonCode("ManualPause");
    }
  }

  return (
    <>
      <Card className="rounded-xl border-border shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Utensils className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  {kioskName ? `Món tại ${kioskName}` : "Món đang bán tại kiosk"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tạm dừng hoặc mở bán lại một món mà không thay đổi thực đơn dùng chung.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={availability.refresh} isLoading={availability.isLoading}>
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b border-border p-4">
            <div className="relative max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={availability.search}
                onChange={(event) => availability.setSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc mã món..."
              />
            </div>
          </div>

          {availability.errorMessage ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <AlertTriangle className="size-7 text-destructive" />
              <p className="text-sm text-destructive">{availability.errorMessage}</p>
              <Button variant="outline" onClick={availability.refresh}>Thử lại</Button>
            </div>
          ) : availability.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : availability.items.length === 0 ? (
            <div className="space-y-2 p-10 text-center">
              <Utensils className="mx-auto size-8 text-muted-foreground" />
              <p className="font-medium">Chưa có món đang mở bán tại kiosk</p>
              <p className="text-sm text-muted-foreground">
                Hãy kiểm tra thực đơn đã được kích hoạt, còn hiệu lực và được áp dụng đúng cho cửa hàng hoặc kiosk này.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Món</TableHead>
                    <TableHead>Thực đơn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Lý do gần nhất</TableHead>
                    <TableHead className="pr-5 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availability.items.map((item) => (
                    <TableRow key={`${item.menuId}-${item.menuItemId}`}>
                      <TableCell className="pl-5 font-medium">{item.displayName}</TableCell>
                      <TableCell>{item.menuName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.state === "Available"
                              ? "border-success/20 bg-success/10 text-success"
                              : "border-warning/20 bg-warning/10 text-warning"
                          }
                        >
                          {item.state === "Available" ? "Đang mở bán" : "Đang tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">
                        {item.reason || (item.catalogSellable ? "Không có" : "Catalog hiện chưa khả dụng")}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={availability.isSubmitting}
                          onClick={() => {
                            availability.clearMutationError();
                            setPendingItem(item);
                          }}
                        >
                          {item.state === "Available" ? <CirclePause className="size-4" /> : <CirclePlay className="size-4" />}
                          {item.state === "Available" ? "Tạm dừng" : "Mở bán"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(pendingItem)} onOpenChange={(open) => !open && !availability.isSubmitting && setPendingItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isPausing ? "Tạm dừng bán món" : "Mở bán lại món"}</DialogTitle>
            <DialogDescription>
              {pendingItem?.displayName}. Thao tác chỉ áp dụng cho kiosk này.
            </DialogDescription>
          </DialogHeader>
          {isPausing ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Lý do</Label>
                <Select value={reasonCode} onValueChange={(value) => setReasonCode(value as MenuItemOperationalAvailabilityReasonCode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lý do">{selectedReasonLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability-reason">Ghi chú</Label>
                <Input id="availability-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mô tả ngắn để ca sau dễ theo dõi" />
              </div>
            </div>
          ) : null}
          {availability.mutationError ? <p className="text-sm text-destructive">{availability.mutationError}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={availability.isSubmitting} onClick={() => setPendingItem(null)}>Hủy</Button>
            <Button variant={isPausing ? "destructive" : "default"} isLoading={availability.isSubmitting} onClick={() => void confirmChange()}>
              {isPausing ? "Xác nhận tạm dừng" : "Xác nhận mở bán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
