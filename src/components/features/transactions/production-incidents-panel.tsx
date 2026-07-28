"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductionIncidents } from "@/hooks/use-production-incidents";
import type {
  ProductionIncidentResolution,
  ProductionIncidentStatus,
  ProductionInspectionOutcome,
} from "@/types/transactions";
import { formatTransactionDate } from "./transactions-table";

const STATUS_LABELS: Record<ProductionIncidentStatus, string> = {
  Open: "Đang mở",
  AwaitingInspection: "Chờ kiểm tra",
  ResolutionSelected: "Đã chọn hướng xử lý",
  ResolutionInProgress: "Đang xử lý",
  Resolved: "Đã giải quyết",
  Cancelled: "Đã hủy",
};

const INSPECTION_LABELS: Record<ProductionInspectionOutcome, string> = {
  ConfirmedGood: "Đầu ra đạt yêu cầu",
  NotProduced: "Không tạo ra sản phẩm",
  Defective: "Sản phẩm bị lỗi",
  PartialOrUncertain: "Một phần hoặc chưa chắc chắn",
  Unknown: "Chưa xác định",
};

const RESOLUTION_LABELS: Record<ProductionIncidentResolution, string> = {
  DeliverExistingOutput: "Giao đầu ra hiện có",
  DiscardProduct: "Loại bỏ sản phẩm",
  RequestRemake: "Làm lại đúng đơn vị bị ảnh hưởng",
  RequestRefund: "Yêu cầu hoàn tiền",
  IssueVoucher: "Cấp voucher",
  AwaitTechnicalReview: "Chờ kỹ thuật kiểm tra",
  NoAction: "Không cần thao tác thêm",
};

const PHYSICAL_OUTPUT_LABELS: Record<string, string> = {
  Yes: "Có đầu ra",
  No: "Không có đầu ra",
  Partial: "Đầu ra một phần",
  Unknown: "Chưa xác định",
};

const TRIGGER_LABELS: Record<string, string> = {
  ExecutionFailed: "Thực thi thất bại",
  ManualInterventionRequired: "Cần can thiệp thủ công",
  DefectiveOutputReported: "Báo cáo sản phẩm lỗi",
  OutcomeUnknown: "Kết quả chưa xác định",
};

type ActionMode = "inspection" | "resolution" | "complete" | null;

function statusTone(status: ProductionIncidentStatus) {
  if (status === "Resolved") return "border-success/20 bg-success/10 text-success";
  if (status === "Cancelled") return "border-border bg-muted/20 text-muted-foreground";
  if (status === "AwaitingInspection") return "border-warning/20 bg-warning/10 text-warning";
  return "border-destructive/20 bg-destructive/10 text-destructive";
}

export function ProductionIncidentsPanel({ enabled }: { enabled: boolean }) {
  const incidents = useProductionIncidents(enabled);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [inspectionOutcome, setInspectionOutcome] =
    useState<ProductionInspectionOutcome>("ConfirmedGood");
  const [resolution, setResolution] =
    useState<ProductionIncidentResolution>("AwaitTechnicalReview");
  const [reason, setReason] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [resolutionRequestId, setResolutionRequestId] = useState<string | null>(null);

  const safeResolutions = useMemo(() => {
    const outcome = incidents.selectedIncident?.inspectionOutcome;
    const options: ProductionIncidentResolution[] = [
      "DiscardProduct",
      "AwaitTechnicalReview",
      "NoAction",
    ];
    if (outcome === "ConfirmedGood") options.unshift("DeliverExistingOutput");
    if (outcome === "NotProduced" || outcome === "Defective") {
      options.unshift("RequestRemake");
    }
    return options;
  }, [incidents.selectedIncident?.inspectionOutcome]);

  const openAction = (mode: Exclude<ActionMode, null>) => {
    setActionMode(mode);
    setReason("");
    setClientError(null);
    if (mode === "resolution") {
      const firstResolution = safeResolutions[0] ?? "AwaitTechnicalReview";
      setResolution(firstResolution);
      setResolutionRequestId(crypto.randomUUID());
    }
  };

  const closeAction = () => {
    if (!incidents.isMutating) {
      setActionMode(null);
      setClientError(null);
      setResolutionRequestId(null);
    }
  };

  const submitAction = async () => {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setClientError("Vui lòng nhập lý do hoặc ghi chú vận hành.");
      return;
    }

    let succeeded = false;
    if (actionMode === "inspection") {
      succeeded = await incidents.inspect({ outcome: inspectionOutcome, reason: normalizedReason });
    } else if (actionMode === "resolution") {
      succeeded = await incidents.resolve({
        resolutionRequestId: resolutionRequestId ?? crypto.randomUUID(),
        resolution,
        reason: normalizedReason,
        acknowledgeFullOrderCompensation: false,
      });
    } else if (actionMode === "complete") {
      succeeded = await incidents.complete({ notes: normalizedReason });
    }

    if (succeeded) closeAction();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Sự cố sản xuất</h2>
          <p className="text-sm text-muted-foreground">
            Kiểm tra đầu ra và xử lý theo đúng đơn vị sản xuất bị ảnh hưởng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={incidents.status}
            onValueChange={(value) =>
              incidents.setStatus(value as ProductionIncidentStatus | "ALL")
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {(Object.entries(STATUS_LABELS) as Array<[ProductionIncidentStatus, string]>).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void incidents.refresh()} isLoading={incidents.isLoading}>
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {incidents.errorMessage ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{incidents.errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void incidents.refresh()}>
            Thử lại
          </Button>
        </div>
      ) : incidents.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : incidents.incidents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="font-medium text-foreground">Không có sự cố phù hợp</p>
          <p className="text-sm text-muted-foreground">Không có đơn vị sản xuất nào cần xử lý trong phạm vi hiện tại.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Đơn hàng / sản phẩm</TableHead>
                <TableHead className="text-center">Đơn vị bị ảnh hưởng</TableHead>
                <TableHead className="text-center">Đầu ra</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Thời điểm</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{incident.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.productName} · {incident.productVariantName}
                    </p>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    #{incident.productionUnitNo}
                    {incident.productionUnitQuantity > 1
                      ? ` - #${incident.productionUnitNo + incident.productionUnitQuantity - 1}`
                      : ""}
                  </TableCell>
                  <TableCell className="text-center">
                    {PHYSICAL_OUTPUT_LABELS[incident.physicalOutputState] ?? incident.physicalOutputState}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={statusTone(incident.status)}>
                      {STATUS_LABELS[incident.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {formatTransactionDate(incident.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xem sự cố của đơn ${incident.orderNumber}`}
                      title={`Xem sự cố của đơn ${incident.orderNumber}`}
                      onClick={() => void incidents.openDetail(incident)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{incidents.pagination.totalCount} sự cố</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!incidents.pagination.hasPrevious} onClick={incidents.previousPage}>
            <ChevronLeft className="size-4" /> Trước
          </Button>
          <Button variant="outline" size="sm" disabled={!incidents.pagination.hasNext} onClick={incidents.nextPage}>
            Sau <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={incidents.isDetailOpen} onOpenChange={incidents.setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết sự cố sản xuất</DialogTitle>
            <DialogDescription>
              Bằng chứng đầu ra theo đúng đơn vị sản xuất, không phải retry toàn bộ đơn.
            </DialogDescription>
          </DialogHeader>
          {incidents.isDetailLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-muted/40" />)}</div>
          ) : incidents.detailErrorMessage ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{incidents.detailErrorMessage}</p>
              </div>
              {incidents.selectedIncident ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void incidents.openDetail(incidents.selectedIncident!)}
                >
                  Thử lại
                </Button>
              ) : null}
            </div>
          ) : incidents.selectedIncident ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Đơn hàng" value={incidents.selectedIncident.orderNumber} />
                <Info label="Sản phẩm" value={`${incidents.selectedIncident.productName} · ${incidents.selectedIncident.productVariantName}`} />
                <Info label="Đơn vị sản xuất" value={`Từ #${incidents.selectedIncident.productionUnitNo}, số lượng ${incidents.selectedIncident.productionUnitQuantity}`} />
                <Info label="Nguyên nhân" value={TRIGGER_LABELS[incidents.selectedIncident.trigger] ?? incidents.selectedIncident.trigger} />
                <Info label="Đầu ra vật lý" value={PHYSICAL_OUTPUT_LABELS[incidents.selectedIncident.physicalOutputState] ?? incidents.selectedIncident.physicalOutputState} />
                <Info label="Kết quả kiểm tra" value={incidents.selectedIncident.inspectionOutcome ? INSPECTION_LABELS[incidents.selectedIncident.inspectionOutcome] : "Chưa kiểm tra"} />
                <Info label="Hướng xử lý" value={incidents.selectedIncident.resolution ? RESOLUTION_LABELS[incidents.selectedIncident.resolution] : "Chưa chọn"} />
                <Info label="Trạng thái" value={STATUS_LABELS[incidents.selectedIncident.status]} />
              </div>

              {incidents.selectedIncident.errorMessage ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                  {incidents.selectedIncident.errorMessage}
                </div>
              ) : null}

              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-medium text-foreground">Lịch sử xử lý</p>
                {incidents.selectedIncident.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có lịch sử.</p>
                ) : (
                  <div className="space-y-2">
                    {incidents.selectedIncident.history.map((entry) => (
                      <div key={entry.id} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                          <span className="font-medium text-foreground">{entry.action}</span>
                          <span className="text-xs text-muted-foreground">{formatTransactionDate(entry.occurredAt)}</span>
                        </div>
                        <p className="text-muted-foreground">{entry.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-wrap">
                {(incidents.selectedIncident.status === "Open" || incidents.selectedIncident.status === "AwaitingInspection") ? (
                  <Button variant="outline" onClick={() => openAction("inspection")}>Ghi nhận kiểm tra</Button>
                ) : null}
                {incidents.selectedIncident.inspectionOutcome && incidents.selectedIncident.status === "Open" ? (
                  <Button onClick={() => openAction("resolution")}>Chọn hướng xử lý</Button>
                ) : null}
                {incidents.selectedIncident.status === "ResolutionInProgress" ? (
                  <Button onClick={() => openAction("complete")}>Hoàn tất xử lý</Button>
                ) : null}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={actionMode !== null} onOpenChange={(open) => { if (!open) closeAction(); }}>
        <DialogContent showCloseButton={!incidents.isMutating}>
          <DialogHeader>
            <span className="flex size-10 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
              <ShieldAlert className="size-5" />
            </span>
            <DialogTitle>
              {actionMode === "inspection" ? "Ghi nhận kết quả kiểm tra" : actionMode === "resolution" ? "Chọn hướng xử lý" : "Hoàn tất sự cố"}
            </DialogTitle>
            <DialogDescription>
              Thao tác chỉ áp dụng cho đơn vị #{incidents.selectedIncident?.productionUnitNo}
              {incidents.selectedIncident && incidents.selectedIncident.productionUnitQuantity > 1
                ? ` đến #${incidents.selectedIncident.productionUnitNo + incidents.selectedIncident.productionUnitQuantity - 1}`
                : ""}.
            </DialogDescription>
          </DialogHeader>

          {actionMode === "inspection" ? (
            <div className="space-y-2">
              <Label>Kết quả kiểm tra</Label>
              <Select value={inspectionOutcome} onValueChange={(value) => setInspectionOutcome(value as ProductionInspectionOutcome)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INSPECTION_LABELS) as Array<[ProductionInspectionOutcome, string]>).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {actionMode === "resolution" ? (
            <div className="space-y-2">
              <Label>Hướng xử lý</Label>
              <Select value={resolution} onValueChange={(value) => setResolution(value as ProductionIncidentResolution)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {safeResolutions.map((value) => (
                    <SelectItem key={value} value={value}>{RESOLUTION_LABELS[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {resolution === "RequestRemake" ? (
                <p className="text-xs leading-5 text-warning">
                  Backend sẽ làm lại đúng unit range của sự cố. Các đầu ra thành công khác được giữ nguyên.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="incident-reason">{actionMode === "complete" ? "Ghi chú hoàn tất" : "Lý do"}</Label>
            <textarea
              id="incident-reason"
              value={reason}
              maxLength={1000}
              disabled={incidents.isMutating}
              className="min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          {clientError ? <p className="text-sm text-destructive">{clientError}</p> : null}
          {incidents.detailErrorMessage ? <p className="text-sm text-destructive">{incidents.detailErrorMessage}</p> : null}

          <DialogFooter>
            <Button variant="outline" disabled={incidents.isMutating} onClick={closeAction}>Hủy</Button>
            <Button isLoading={incidents.isMutating} onClick={() => void submitAction()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
