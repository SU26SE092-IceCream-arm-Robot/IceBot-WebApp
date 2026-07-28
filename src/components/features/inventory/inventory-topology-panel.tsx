"use client";

import {
  AlertTriangle,
  Box,
  CircleCheck,
  Cpu,
  Link2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from "lucide-react";
import { useCallback, useState } from "react";

import {
  InventoryTopologyOperationDialog,
  type TopologyOperationMode,
} from "@/components/features/inventory/inventory-topology-operation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryTopology } from "@/hooks/use-inventory-topology";
import { useInventoryTopologyOperations } from "@/hooks/use-inventory-topology-operations";
import type {
  DispenserStateResult,
  InventoryTopologyWarning,
} from "@/types/inventory-management";

const WARNING_LABELS: Record<string, string> = {
  DeviceInactive: "Thiết bị không hoạt động",
  DeviceUnavailable: "Thiết bị chưa sẵn sàng",
  ContainerInactive: "Khay nguyên liệu đã tắt",
  IngredientInactive: "Nguyên liệu đã tắt",
};

function warningLabel(warning: InventoryTopologyWarning): string {
  return WARNING_LABELS[warning] ?? warning;
}

interface InventoryTopologyPanelProps {
  kioskId: string | null;
  canConfigure: boolean;
  onInventoryChanged: () => Promise<void>;
}

export function InventoryTopologyPanel({
  kioskId,
  canConfigure,
  onInventoryChanged,
}: InventoryTopologyPanelProps) {
  const { topology, isLoading, errorMessage, refresh } =
    useInventoryTopology(kioskId);
  const refreshEvidence = useCallback(async () => {
    await Promise.all([refresh(), onInventoryChanged()]);
  }, [onInventoryChanged, refresh]);
  const operations = useInventoryTopologyOperations(kioskId, refreshEvidence);
  const [operationMode, setOperationMode] =
    useState<TopologyOperationMode>("create");
  const [operationTarget, setOperationTarget] =
    useState<DispenserStateResult | null>(null);
  const [isOperationOpen, setIsOperationOpen] = useState(false);

  const openOperation = async (
    mode: TopologyOperationMode,
    dispenserStateId?: string,
  ) => {
    const resources = await operations.loadResources();
    const target = dispenserStateId
      ? resources.find((state) => state.id === dispenserStateId) ?? null
      : null;
    if (mode !== "create" && !target) return;
    operations.clearMutationError();
    setOperationMode(mode);
    setOperationTarget(target);
    setIsOperationOpen(true);
  };

  const warnings = topology?.devices.flatMap((device) => [
    ...device.warnings.map((warning) => ({
      key: `${device.deviceId}-${warning}`,
      deviceName: device.name,
      message: warningLabel(warning),
    })),
    ...(device.canHostDispenser && !device.hasConfiguredContainers
      ? [
          {
            key: `${device.deviceId}-missing-container`,
            deviceName: device.name,
            message: "Chưa cấu hình khay nguyên liệu",
          },
        ]
      : []),
    ...device.containers.flatMap((container) =>
      container.warnings.map((warning) => ({
        key: `${container.dispenserStateId}-${warning}`,
        deviceName: `${device.name} · ${container.containerCode}`,
        message: warningLabel(warning),
      })),
    ),
  ]);

  return (
    <Card className="gap-0 rounded-xl border border-border/80 bg-card py-0 shadow-none">
      <CardHeader className="border-b border-border px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <Cpu className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Chẩn đoán cấu hình tồn kho
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Kiểm tra thiết bị, khay và nguyên liệu theo kiosk đã chọn.
              </p>
            </div>
          </div>
          {kioskId ? (
            <div className="flex flex-wrap gap-2">
              {canConfigure ? (
                <Button size="sm" onClick={() => void openOperation("create")}>
                  <Plus className="size-4" />
                  Tạo bộ phân phối
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                isLoading={isLoading}
                onClick={() => void refresh()}
              >
                <RefreshCw className="size-4" />
                Làm mới
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {operations.refreshWarningMessage ? (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
            <p>{operations.refreshWarningMessage}</p>
            <Button
              variant="outline"
              size="sm"
              isLoading={operations.isRefreshRetrying}
              onClick={() => void operations.retryRefresh()}
            >
              Tải lại dữ liệu
            </Button>
          </div>
        ) : null}
        {!kioskId ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
            <p className="text-sm font-medium">Chọn một kiosk để xem chẩn đoán</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cấu hình phân phối nguyên liệu theo từng kiosk.
            </p>
          </div>
        ) : isLoading && !topology ? (
          <div className="space-y-3" aria-label="Đang tải chẩn đoán tồn kho">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Không thể tải chẩn đoán tồn kho
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Thử lại
            </Button>
          </div>
        ) : !topology || topology.devices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
            <p className="text-sm font-medium">Chưa có thiết bị tồn kho</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Backend chưa trả về thiết bị nào trong topology của kiosk này.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{topology.kioskName}</Badge>
              <Badge variant="secondary">{topology.devices.length} thiết bị</Badge>
              <Badge variant={warnings?.length ? "destructive" : "default"}>
                {warnings?.length ?? 0} cảnh báo
              </Badge>
            </div>

            {warnings?.length ? (
              <div className="grid gap-2 lg:grid-cols-2">
                {warnings.map((warning) => (
                  <div
                    key={warning.key}
                    className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2.5"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{warning.deviceName}</p>
                      <p className="text-sm text-muted-foreground">{warning.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
                <CircleCheck className="size-5 shrink-0" />
                Backend không ghi nhận cảnh báo topology cho kiosk này.
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {topology.devices.map((device) => (
                <div key={device.deviceId} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.code} · {device.deviceTypeCode}
                      </p>
                    </div>
                    <Badge variant="outline">{device.status}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {device.containers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {device.canHostDispenser
                          ? "Chưa có khay nguyên liệu được cấu hình."
                          : "Thiết bị này không khai báo khả năng chứa khay nguyên liệu."}
                      </p>
                    ) : (
                      device.containers.map((container) => (
                        <div
                          key={container.dispenserStateId}
                          className="flex flex-col gap-2 rounded-md bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Box className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {container.ingredientName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {container.containerCode}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Badge variant={container.isActive ? "secondary" : "destructive"}>
                              {container.isActive ? "Đang dùng" : "Đã tắt"}
                            </Badge>
                            {canConfigure ? (
                              <>
                                <Button type="button" variant="ghost" size="icon-sm" title="Cập nhật cấu hình khay" aria-label="Cập nhật cấu hình khay" onClick={() => void openOperation("update", container.dispenserStateId)}>
                                  <Pencil className="size-4" />
                                </Button>
                                {container.isActive ? (
                                  <Button type="button" variant="ghost" size="icon-sm" title="Thay thế liên kết khay" aria-label="Thay thế liên kết khay" onClick={() => void openOperation("rebind", container.dispenserStateId)}>
                                    <Link2 className="size-4" />
                                  </Button>
                                ) : null}
                                <Button type="button" variant="ghost" size="icon-sm" title={container.isActive ? "Ngừng sử dụng khay" : "Kích hoạt lại khay"} aria-label={container.isActive ? "Ngừng sử dụng khay" : "Kích hoạt lại khay"} onClick={() => void openOperation("status", container.dispenserStateId)}>
                                  <Power className="size-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <InventoryTopologyOperationDialog
        key={`${operationMode}-${operationTarget?.id ?? "new"}-${isOperationOpen ? "open" : "closed"}`}
        mode={operationMode}
        target={operationTarget}
        devices={topology?.devices ?? []}
        ingredients={operations.ingredients}
        isLoadingIngredients={operations.isLoadingIngredients}
        lookupErrorMessage={operations.lookupErrorMessage}
        mutationErrorMessage={operations.mutationErrorMessage}
        isSubmitting={operations.isMutating}
        open={isOperationOpen}
        onOpenChange={(open) => {
          setIsOperationOpen(open);
          if (!open) setOperationTarget(null);
        }}
        onCreate={operations.create}
        onUpdate={operations.update}
        onRebind={operations.rebind}
        onSetStatus={operations.setStatus}
      />
    </Card>
  );
}
