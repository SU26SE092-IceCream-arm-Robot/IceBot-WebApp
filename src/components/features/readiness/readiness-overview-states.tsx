"use client";

import { AlertTriangle, CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReadinessSourceFailure } from "@/types/setup-readiness";

export function ReadinessLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card>
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}

interface ReadinessErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ReadinessErrorState({ message, onRetry }: ReadinessErrorStateProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-foreground">
              Không thể kiểm tra sẵn sàng vận hành
            </p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}

export function ReadinessEmptyState() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4">
        <CircleHelp className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">Chọn tổ chức và cửa hàng</p>
          <p className="text-sm text-muted-foreground">
            Readiness cần một phạm vi cụ thể để đối chiếu kiosk, thực đơn và thanh
            toán.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReadinessPartialFailureBannerProps {
  failures: ReadinessSourceFailure[];
  unknownCount: number;
}

const SOURCE_LABELS: Record<ReadinessSourceFailure["source"], string> = {
  organization: "Tổ chức",
  store: "Cửa hàng",
  kiosks: "Kiosk",
  products: "Sản phẩm",
  menus: "Thực đơn",
  paymentMethods: "Thanh toán",
};

export function ReadinessPartialFailureBanner({
  failures,
  unknownCount,
}: ReadinessPartialFailureBannerProps) {
  if (failures.length === 0 && unknownCount === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <div>
            <p className="font-medium text-foreground">
              Một số nguồn dữ liệu chưa kiểm tra được
            </p>
            <p className="text-muted-foreground">
              Kết quả vẫn hiển thị phần đã đọc được từ backend. Các mục không rõ sẽ
              không được suy diễn.
            </p>
          </div>
          {failures.length > 0 ? (
            <ul className="space-y-1 text-muted-foreground">
              {failures.map((failure) => (
                <li key={`${failure.source}-${failure.statusCode ?? "unknown"}`}>
                  {SOURCE_LABELS[failure.source]}: {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
