"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useState } from "react";

import { EdgeDeploymentArtifactsPanel } from "@/components/features/kiosks/deployments/edge-deployment-artifacts-panel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKioskDeployments } from "@/hooks/kiosks/use-kiosk-deployments";

interface ProductionOperationsPanelProps {
  organizationId: string;
  kioskId: string;
  canDeploy: boolean;
  canRollback: boolean;
}
const statusLabels: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã phát hành",
  Retired: "Đã ngừng sử dụng",
  Pending: "Đang chờ",
  Materializing: "Đang chuẩn bị dữ liệu",
  Installed: "Đã cài đặt",
  Failed: "Thất bại",
  Superseded: "Đã được thay thế",
  Abandoned: "Đã hủy",
  ReadyForReview: "Chờ duyệt chuyển đổi",
  Completed: "Đã hoàn tất",
  RollbackPending: "Đang khôi phục phiên bản trước",
  RolledBack: "Đã khôi phục phiên bản trước",
  Active: "Đã kích hoạt",
};

const profileLabels: Record<string, string> = {
  FullEdge: "Bộ điều khiển đầy đủ",
  LowCostController: "Bộ điều khiển giới hạn",
};

const readinessLabels: Record<string, string> = {
  Ready: "Sẵn sàng",
  Low: "Sắp hết",
  Empty: "Đã hết",
  Unknown: "Chưa xác định",
  NotReady: "Chưa sẵn sàng",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Failed"
      ? "destructive"
      : status === "Active" ||
          status === "Installed" ||
          status === "Published" ||
          status === "Completed"
        ? "default"
        : "outline";
  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ProductionOperationsPanel(
  props: ProductionOperationsPanelProps,
) {
  const state = useKioskDeployments({
    organizationId: props.organizationId,
    kioskId: props.kioskId,
  });
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>("");
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [deploymentReason, setDeploymentReason] = useState("");

  const selectedRelease = state.releases.find(
    (item) => item.id === selectedReleaseId,
  );
  const publishedReleases = state.releases.filter(
    (item) => item.status === "Published",
  );
  const eligibleEndpoint = state.deploymentPreview?.endpoints.find(
    (item) => item.kioskExecutionEndpointId === selectedEndpointId,
  );

  if (state.isLoading) {
    return (
      <div className="rounded-lg border p-5 text-sm text-muted-foreground">
        Đang tải trạng thái triển khai cấu hình...
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Settings2 className="size-4" />
            Triển khai cấu hình cho kiosk
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn bản phát hành, kiểm tra điều kiện kiosk, triển khai hoặc quay lại phiên bản ổn định.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void state.refresh()}
          disabled={state.isLoading || state.isMutating}
        >
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>

      {state.warnings.map((warning) => (
        <div
          key={warning}
          className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {warning}
        </div>
      ))}
      {state.mutationError ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.mutationError}
        </p>
      ) : null}

      <div className="space-y-4">
        <div>
          <h4 className="font-medium">Triển khai phiên bản đã phát hành</h4>
          <p className="text-xs text-muted-foreground">
            Chọn phiên bản đã phát hành, kiểm tra trạng thái kiosk rồi triển khai hoặc rollback.
          </p>
        </div>
          {props.canDeploy ? (
            <div className="space-y-3 rounded-lg border p-4">
              {publishedReleases.length === 0 ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <p className="font-medium text-warning">
                    Chưa có phiên bản cấu hình đã phát hành
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chương trình robot đã phát hành chưa thể triển khai trực tiếp.
                    Cần tạo và phát hành phiên bản cấu hình chứa liên kết Recipe
                    và chương trình trước.
                  </p>
                  <Link
                    href="/production"
                    className={`${buttonVariants({ size: "sm", variant: "outline" })} mt-3`}
                  >
                    Mở Cấu hình sản xuất
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={selectedReleaseId}
                    onValueChange={(value) => {
                      setSelectedReleaseId(value ?? "");
                      setSelectedEndpointId("");
                      setAcknowledgeRisk(false);
                      state.clearPreviews();
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {selectedRelease
                          ? `Phiên bản ${selectedRelease.releaseNumber} · ${statusLabels[selectedRelease.status] ?? selectedRelease.status}`
                          : "Chọn phiên bản đã phát hành"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {publishedReleases.map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          Phiên bản {release.releaseNumber} ·{" "}
                          {release.routeCount} món đã cấu hình
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!selectedReleaseId || state.isMutating}
                    onClick={() =>
                      void state.previewDeployment(selectedReleaseId)
                    }
                  >
                    Kiểm tra triển khai
                  </Button>
                </div>
              )}
              {state.deploymentPreview ? (
                <div className="space-y-3">
                  <div
                    className={`rounded-lg border p-3 ${state.inventoryReadiness?.isReady ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}
                  >
                    <p className="font-medium">
                      Tồn kho:{" "}
                      {state.inventoryReadiness?.isReady
                        ? "Sẵn sàng"
                        : "Chưa sẵn sàng"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {readinessLabels[
                        state.inventoryReadiness?.overallStatus ?? ""
                      ] ?? "Không thể xác định"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Điểm thực thi</Label>
                    <Select
                      value={selectedEndpointId}
                      onValueChange={(value) =>
                        setSelectedEndpointId(value ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {eligibleEndpoint
                            ? `${eligibleEndpoint.endpointCode} — ${profileLabels[eligibleEndpoint.executionProfile] ?? eligibleEndpoint.executionProfile}`
                            : "Chọn điểm thực thi từ bản xem trước"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {state.deploymentPreview.endpoints.map((endpoint) => (
                          <SelectItem
                            key={endpoint.kioskExecutionEndpointId}
                            value={endpoint.kioskExecutionEndpointId}
                          >
                            {endpoint.endpointCode} —{" "}
                            {profileLabels[endpoint.executionProfile] ??
                              endpoint.executionProfile}{" "}
                            —{" "}
                            {endpoint.isEligible
                              ? "Đủ điều kiện"
                              : `${endpoint.blockers.length} điều kiện chưa đạt`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {eligibleEndpoint ? (
                    <div className="rounded-lg border p-3 text-sm">
                      <p>
                        {eligibleEndpoint.artifactCount} tệp thực thi ·{" "}
                        {(eligibleEndpoint.artifactStorageBytes / 1024).toFixed(
                          1,
                        )}{" "}
                        KB
                      </p>
                      {eligibleEndpoint.blockers.map((blocker) => (
                        <p
                          key={`${blocker.code}-${blocker.message}`}
                          className="mt-1 text-destructive"
                        >
                          {blocker.message}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={acknowledgeRisk}
                      onChange={(event) =>
                        setAcknowledgeRisk(event.target.checked)
                      }
                    />
                    <span>
                      Tôi đã xem bản kiểm tra và xác nhận các rủi ro còn lại.
                    </span>
                  </label>
                  <Button
                    disabled={
                      !eligibleEndpoint?.isEligible ||
                      !acknowledgeRisk ||
                      deploymentReason.trim().length < 3 ||
                      state.isMutating
                    }
                    onClick={() => {
                      if (
                        state.deploymentPreview &&
                        eligibleEndpoint &&
                        window.confirm(
                          "Triển khai cấu hình đã chọn tới điểm thực thi này?",
                        )
                      )
                        void state.deploy(
                          state.deploymentPreview,
                          eligibleEndpoint.kioskExecutionEndpointId,
                          true,
                          deploymentReason,
                        );
                    }}
                  >
                    <Rocket className="size-4" />
                    Triển khai
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {props.canDeploy || props.canRollback ? (
            <div className="space-y-1.5">
              <Label htmlFor="deployment-reason">
                Lý do triển khai hoặc rollback
              </Label>
              <Input
                id="deployment-reason"
                value={deploymentReason}
                minLength={3}
                maxLength={500}
                disabled={state.isMutating}
                onChange={(event) => setDeploymentReason(event.target.value)}
                placeholder="Nhập từ 3 đến 500 ký tự để lưu nhật ký vận hành"
              />
            </div>
          ) : null}
          {state.deployments.length === 0 ? (
            <EmptyState>Chưa có lịch sử triển khai cho kiosk này.</EmptyState>
          ) : (
            <div className="divide-y rounded-lg border">
              {state.deployments.map((deployment) => {
                const isCurrentActive =
                  deployment.observedActiveDeploymentId === deployment.id;
                const canRollbackTarget = Boolean(
                  props.canRollback &&
                  deployment.status === "Active" &&
                  deployment.observedActiveDeploymentId &&
                  !isCurrentActive,
                );
                return (
                  <div
                    key={deployment.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          Phiên bản {deployment.releaseNumber}
                        </span>
                        <StatusBadge status={deployment.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {deployment.endpointCode} ·{" "}
                        {profileLabels[deployment.profile] ??
                          deployment.profile}{" "}
                        ·{" "}
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(deployment.requestedAt))}
                      </p>
                      {deployment.failureReason ? (
                        <p className="mt-1 text-xs text-destructive">
                          {deployment.failureReason}
                        </p>
                      ) : null}
                    </div>
                    {canRollbackTarget ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={
                          state.isMutating || deploymentReason.trim().length < 3
                        }
                        onClick={() => {
                          if (
                            deployment.observedActiveDeploymentId &&
                            window.confirm(
                              "Rollback về cấu hình của lần triển khai này?",
                            )
                          )
                            void state.rollbackDeployment(
                              deployment.id,
                              deployment.observedActiveDeploymentId,
                              deploymentReason,
                            );
                        }}
                      >
                        <RotateCcw className="size-4" />
                        Rollback
                      </Button>
                    ) : isCurrentActive ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="size-4" />
                        Đang kích hoạt
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <EdgeDeploymentArtifactsPanel
            kioskId={props.kioskId}
            deployments={state.deployments}
          />
      </div>
    </section>
  );
}
