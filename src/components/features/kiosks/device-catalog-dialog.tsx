"use client";

import {
  AlertTriangle,
  Boxes,
  Cpu,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DeviceTypeStatusFilter,
  useDeviceCatalog,
} from "@/hooks/use-device-catalog";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Array<{
  value: DeviceTypeStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang sử dụng" },
  { value: "INACTIVE", label: "Đã tắt" },
];

function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
      <AlertTriangle className="size-7 text-destructive" />
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Thử lại
      </Button>
    </div>
  );
}

export function DeviceCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const catalog = useDeviceCatalog(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cpu className="size-5 text-primary" />
            Danh mục loại và model thiết bị
          </DialogTitle>
          <DialogDescription>
            Tra cứu cấu hình phần cứng do backend quản lý. Nội dung chỉ đọc.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[560px] md:grid-cols-[340px_minmax(0,1fr)]">
          <section className="border-b border-border md:border-r md:border-b-0">
            <div className="grid gap-2 border-b border-border bg-muted/10 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalog.typeSearch}
                  onChange={(event) => catalog.setTypeSearch(event.target.value)}
                  placeholder="Tìm loại thiết bị..."
                  className="bg-card pl-9"
                />
              </div>
              <Select
                value={catalog.status}
                onValueChange={(value) =>
                  catalog.setStatus(value as DeviceTypeStatusFilter)
                }
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue>
                    {STATUS_OPTIONS.find(
                      (option) => option.value === catalog.status,
                    )?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[460px] overflow-y-auto">
              {catalog.typesLoading ? (
                <LoadingRows />
              ) : catalog.typesError ? (
                <ErrorPanel
                  message={catalog.typesError}
                  onRetry={catalog.retryTypes}
                />
              ) : catalog.types.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
                  <Boxes className="size-7 text-muted-foreground" />
                  <p className="mt-3 font-medium">Không có loại thiết bị phù hợp</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {catalog.types.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => catalog.selectType(type.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                        catalog.selectedTypeId === type.id
                          ? "border-primary/30 bg-primary/10"
                          : "border-transparent hover:border-border hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{type.name}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {type.code}
                          </p>
                        </div>
                        <Badge variant={type.isActive ? "default" : "outline"}>
                          {type.isActive ? "Đang dùng" : "Đã tắt"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {type.category}
                        {type.requiresKioskAssignment
                          ? " · Gán theo kiosk"
                          : " · Không bắt buộc gán kiosk"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0">
            <div className="border-b border-border bg-muted/10 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalog.modelSearch}
                  onChange={(event) => catalog.setModelSearch(event.target.value)}
                  placeholder="Tìm model trong loại đã chọn..."
                  className="bg-card pl-9"
                  disabled={!catalog.selectedType}
                />
              </div>
            </div>

            <div className="max-h-[460px] overflow-y-auto p-4">
              {!catalog.selectedType ? (
                <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
                  Chọn một loại thiết bị để xem model.
                </div>
              ) : catalog.modelsLoading ? (
                <LoadingRows count={3} />
              ) : catalog.modelsError ? (
                <ErrorPanel
                  message={catalog.modelsError}
                  onRetry={catalog.retryModels}
                />
              ) : catalog.models.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <Cpu className="size-7 text-muted-foreground" />
                  <p className="mt-3 font-medium">Chưa có model phù hợp</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {catalog.selectedType.name}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {catalog.models.map((model) => (
                    <article
                      key={model.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{model.name}</h3>
                          <p className="font-mono text-xs text-muted-foreground">
                            {model.code}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {model.manufacturer || "Chưa rõ hãng"}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-muted/20 p-2">
                          <dt className="text-muted-foreground">Model</dt>
                          <dd className="mt-1 font-medium">
                            {model.modelNumber || "Chưa cập nhật"}
                          </dd>
                        </div>
                        <div className="rounded-md bg-muted/20 p-2">
                          <dt className="text-muted-foreground">Firmware</dt>
                          <dd className="mt-1 font-medium">
                            {model.firmwareFamily || "Chưa cập nhật"}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Capabilities</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {model.capabilities.length > 0 ? (
                            model.capabilities.map((capability) => (
                              <Badge key={capability} variant="secondary">
                                {capability}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Backend chưa khai báo capability.
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
