"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadinessCheck } from "@/types/setup-readiness";

interface ReadinessNextActionsProps {
  actions: ReadinessCheck[];
}

const ACTION_COPY: Record<ReadinessCheck["id"], string> = {
  ORG_ACTIVE: "Kích hoạt tổ chức",
  STORE_ACTIVE: "Kích hoạt cửa hàng",
  KIOSK_EXISTS: "Tạo ít nhất một kiosk",
  PRODUCT_EXISTS: "Tạo sản phẩm đầu tiên",
  VARIANT_EXISTS: "Thêm phiên bản sản phẩm",
  MENU_EXISTS: "Tạo thực đơn",
  MENU_ITEM_EXISTS: "Thêm món vào thực đơn",
  PAYMENT_ACTIVE: "Hoàn tất phương thức thanh toán",
};

const ACTION_BADGE: Record<
  ReadinessCheck["status"],
  { label: string; className: string }
> = {
  complete: {
    label: "Hoàn tất",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  missing: {
    label: "Bắt buộc",
    className: "bg-destructive/10 text-destructive",
  },
  warning: {
    label: "Cần hoàn thiện",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  unknown: {
    label: "Cần kiểm tra",
    className: "bg-muted text-muted-foreground",
  },
};

export function ReadinessNextActions({ actions }: ReadinessNextActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Các bước cần thực hiện</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium text-foreground">
                Hệ thống hiện không có cấu hình bắt buộc cần xử lý.
              </p>
              <p className="text-muted-foreground">
                Tiếp tục kiểm tra thủ công bằng dữ liệu demo trước khi trình bày.
              </p>
            </div>
          </div>
        ) : (
          actions.map((check) => (
            <div
              key={check.id}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {ACTION_COPY[check.id]}
                    </p>
                    <Badge className={ACTION_BADGE[check.status].className}>
                      {ACTION_BADGE[check.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{check.title}</p>
                </div>
                {check.action ? (
                  <Link
                    href={check.action.href}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "shrink-0",
                    })}
                  >
                    {check.action.label}
                    <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
