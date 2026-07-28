"use client";

import { AlertTriangle, PackageCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ManualFulfillmentEventType,
  OrderItemResult,
} from "@/types/transactions";

type FulfillmentAction = ManualFulfillmentEventType | "Fulfill" | "Fail";

interface OrderItemFulfillmentDialogProps {
  item: OrderItemResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    action: FulfillmentAction;
    reason: string;
  }) => Promise<boolean>;
}

const MANUAL_ACTIONS: Array<{ value: ManualFulfillmentEventType; label: string }> = [
  { value: "Accepted", label: "Đã nhận xử lý" },
  { value: "Preparing", label: "Đang chuẩn bị" },
  { value: "Completed", label: "Đã hoàn tất" },
  { value: "Failed", label: "Không thể hoàn tất" },
];

export function OrderItemFulfillmentDialog({
  item,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: OrderItemFulfillmentDialogProps) {
  const [action, setAction] = useState<FulfillmentAction>(() =>
    item?.fulfillmentType === "Packaged" ? "Fulfill" : "Accepted",
  );
  const [reason, setReason] = useState("");

  const requiresReason = action === "Failed" || action === "Fail";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          setReason("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <PackageCheck className="size-5" />
          </span>
          <DialogTitle>Cập nhật tiến độ món</DialogTitle>
          <DialogDescription>
            {item ? `${item.productName} · ${item.productVariantName}` : "Món trong đơn"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit({ action, reason });
          }}
        >
          {errorMessage ? (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Trạng thái tiếp theo</Label>
            <Select
              value={action}
              disabled={isSubmitting}
              onValueChange={(value) => setAction(value as FulfillmentAction)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {item?.fulfillmentType === "Manual" ? (
                  MANUAL_ACTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Fulfill">Đã giao món đóng gói</SelectItem>
                    <SelectItem value="Fail">Không thể giao món</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment-reason">
              Lý do {requiresReason ? "(bắt buộc)" : "(không bắt buộc)"}
            </Label>
            <textarea
              id="fulfillment-reason"
              value={reason}
              maxLength={500}
              disabled={isSubmitting}
              className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ghi chú vận hành ngắn gọn"
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Mỗi lần xác nhận dùng một mã sự kiện riêng để backend chống ghi nhận trùng.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
