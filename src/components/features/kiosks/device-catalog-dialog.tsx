"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Cpu,
  Edit3,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import {
  DeviceModelFormDialog,
  DeviceTypeFormDialog,
  RetireDeviceModelDialog,
} from "@/components/features/kiosks/device-catalog-management-dialogs";

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
import type { DeviceModelResult, DeviceTypeResult } from "@/types/device-catalog";

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
  canManage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}) {
  const catalog = useDeviceCatalog(open);
  const [typeFormTarget, setTypeFormTarget] = useState<DeviceTypeResult | "new" | null>(null);
  const [modelFormTarget, setModelFormTarget] = useState<DeviceModelResult | "new" | null>(null);
  const [retireTarget, setRetireTarget] = useState<DeviceModelResult | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Cpu className="size-5 text-primary" />
            Danh mục loại và model thiết bị
          </DialogTitle>
          <DialogDescription>
            {canManage
              ? "Quản lý loại và model phần cứng dùng chung trên nền tảng."
              : "Tra cứu cấu hình phần cứng đang dùng trong hệ thống."}
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
              {canManage ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    catalog.clearMutationError();
                    setTypeFormTarget("new");
                  }}
                >
                  <Plus className="size-4" />
                  Tạo loại thiết bị
                </Button>
              ) : null}
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
                    <div
                      key={type.id}
                      className={cn(
                        "rounded-lg border transition-colors",
                        catalog.selectedTypeId === type.id
                          ? "border-primary/30 bg-primary/10"
                          : "border-transparent hover:border-border hover:bg-muted/30",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => catalog.selectType(type.id)}
                        className="w-full px-3 py-3 text-left"
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
                      {canManage ? (
                        <div className="flex justify-end gap-1 border-t border-border/70 px-2 py-1.5">
                          <Button type="button" variant="ghost" size="icon-sm" title="Chỉnh sửa loại thiết bị" aria-label="Chỉnh sửa loại thiết bị" disabled={catalog.mutationTarget !== null} onClick={() => { catalog.clearMutationError(); setTypeFormTarget(type); }}><Edit3 className="size-4" /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" title={type.isActive ? "Tắt loại thiết bị" : "Kích hoạt loại thiết bị"} aria-label={type.isActive ? "Tắt loại thiết bị" : "Kích hoạt loại thiết bị"} isLoading={catalog.mutationTarget === `type:${type.id}`} onClick={() => void catalog.setTypeStatus(type)}><Power className="size-4" /></Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0">
            <div className="flex flex-col gap-2 border-b border-border bg-muted/10 p-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalog.modelSearch}
                  onChange={(event) => catalog.setModelSearch(event.target.value)}
                  placeholder="Tìm model trong loại đã chọn..."
                  className="bg-card pl-9"
                  disabled={!catalog.selectedType}
                />
              </div>
              {canManage && catalog.selectedType ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!catalog.selectedType.isActive}
                  onClick={() => {
                    catalog.clearMutationError();
                    setModelFormTarget("new");
                  }}
                >
                  <Plus className="size-4" />
                  Tạo model
                </Button>
              ) : null}
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
                              Chưa khai báo khả năng thiết bị.
                            </span>
                          )}
                        </div>
                      </div>
                      {canManage ? (
                        <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                          <Button type="button" variant="ghost" size="sm" disabled={catalog.mutationTarget !== null} onClick={() => { catalog.clearMutationError(); setModelFormTarget(model); }}><Edit3 className="size-4" />Chỉnh sửa</Button>
                          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={catalog.mutationTarget !== null} onClick={() => { catalog.clearMutationError(); setRetireTarget(model); }}><Trash2 className="size-4" />Ngừng sử dụng</Button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>

      <DeviceTypeFormDialog
        key={typeFormTarget === "new" ? "new" : typeFormTarget?.id ?? "closed"}
        open={typeFormTarget !== null}
        deviceType={typeFormTarget === "new" ? null : typeFormTarget}
        isSubmitting={catalog.mutationTarget !== null}
        errorMessage={catalog.mutationError}
        onOpenChange={(next) => !next && setTypeFormTarget(null)}
        onCreate={catalog.createType}
        onUpdate={catalog.updateType}
      />

      {catalog.selectedType ? (
        <DeviceModelFormDialog
          key={modelFormTarget === "new" ? `new:${catalog.selectedType.id}` : modelFormTarget?.id ?? "closed"}
          open={modelFormTarget !== null}
          deviceType={catalog.selectedType}
          model={modelFormTarget === "new" ? null : modelFormTarget}
          isSubmitting={catalog.mutationTarget !== null}
          errorMessage={catalog.mutationError}
          onOpenChange={(next) => !next && setModelFormTarget(null)}
          onCreate={catalog.createModel}
          onUpdate={catalog.updateModel}
        />
      ) : null}

      <RetireDeviceModelDialog
        model={retireTarget}
        isSubmitting={catalog.mutationTarget !== null}
        errorMessage={catalog.mutationError}
        onOpenChange={(next) => !next && setRetireTarget(null)}
        onConfirm={catalog.retireModel}
      />
    </Dialog>
  );
}
