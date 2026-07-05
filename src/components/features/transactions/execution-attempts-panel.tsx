"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExecutionAttempts } from "@/hooks/use-execution-attempts";
import type { ExecutionAttemptDetailResult } from "@/types/transactions";
import { formatTransactionDate } from "./transactions-table";

function DiagnosticField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function AttemptDetail({ detail }: { detail: ExecutionAttemptDetailResult }) {
  const { attempt, provenance } = detail;
  return (
    <div className="space-y-4 border-t border-border bg-muted/10 p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DiagnosticField label="Source command" value={<span className="font-mono text-xs">{attempt.sourceCommandId}</span>} />
        <DiagnosticField label="Hồ sơ thực thi" value={attempt.executionProfile} />
        <DiagnosticField label="Trạng thái thực thi" value={attempt.executionStatus} />
        <DiagnosticField label="Trạng thái quan sát" value={attempt.observationStatus} />
        <DiagnosticField label="Trạng thái phía khách" value={attempt.customerExecutionStatus} />
        <DiagnosticField label="Nguồn executor" value={<span className="font-mono text-xs">{attempt.sourceExecutorId}</span>} />
        <DiagnosticField label="Configuration release" value={<span className="font-mono text-xs">{attempt.sourceConfigurationReleaseId}</span>} />
        <DiagnosticField label="Hết hạn lúc" value={formatTransactionDate(attempt.commandExpiryAt)} />
        <DiagnosticField label="Đã gửi lúc" value={formatTransactionDate(attempt.deliveredAt)} />
        <DiagnosticField label="Đã phản hồi lúc" value={formatTransactionDate(attempt.respondedAt)} />
        <DiagnosticField label="Edge tạo lúc" value={formatTransactionDate(attempt.lastEdgeCreatedAt)} />
        <DiagnosticField label="Executor báo lúc" value={formatTransactionDate(attempt.lastExecutorReportedAt)} />
        <DiagnosticField label="Cloud nhận lúc" value={formatTransactionDate(attempt.cloudReceivedAt)} />
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nguồn gốc</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DiagnosticField label="Loại yêu cầu" value={provenance.isRedispatch ? "Yêu cầu lại" : "Lần gửi ban đầu"} />
          <DiagnosticField label="Lần trước" value={<span className="font-mono text-xs">{provenance.retryOfSourceCommandId}</span>} />
          <DiagnosticField label="Người yêu cầu" value={<span className="font-mono text-xs">{provenance.requestedByAccountId}</span>} />
          <DiagnosticField label="Lý do yêu cầu lại" value={provenance.redispatchReason} />
          <DiagnosticField label="Hết hạn trước khi nhận" value={provenance.timedOutBeforeAcceptance ? "Có" : "Không"} />
          <DiagnosticField label="Ghi nhận hết hạn lúc" value={formatTransactionDate(provenance.timedOutAt)} />
          <DiagnosticField label="Báo cáo thực thi quá hạn" value={provenance.executionReportTimedOut ? "Có" : "Không"} />
          <DiagnosticField label="Ghi nhận quan sát lúc" value={formatTransactionDate(provenance.observationRecordedAt)} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-sm font-semibold">Lần gửi tới endpoint</p>
          {detail.deliveryAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu gửi.</p>
          ) : detail.deliveryAttempts.map((delivery) => (
            <div key={delivery.deliveryAttemptNo} className="border-t border-border py-2 first:border-0 first:pt-0">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Lần {delivery.deliveryAttemptNo} · {delivery.outcome}</span>
                <span className="text-xs text-muted-foreground">{formatTransactionDate(delivery.sentAt)}</span>
              </div>
              {delivery.responseCode || delivery.responseMessage ? (
                <p className="mt-1 text-xs text-muted-foreground">{[delivery.responseCode, delivery.responseMessage].filter(Boolean).join(": ")}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-sm font-semibold">Bằng chứng thực thi</p>
          {detail.productionExecutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bằng chứng thực thi.</p>
          ) : detail.productionExecutions.map((execution) => (
            <div key={execution.id} className="border-t border-border py-2 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{execution.status}</Badge>
                <span className="text-xs text-muted-foreground">Đầu ra: {execution.physicalOutputState}</span>
              </div>
              {execution.errorCode || execution.errorMessage ? (
                <p className="mt-1 text-xs text-destructive">{[execution.errorCode, execution.errorMessage].filter(Boolean).join(": ")}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExecutionAttemptsPanel({ orderId }: { orderId: string }) {
  const state = useExecutionAttempts(orderId);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Cpu className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Lần thực thi</p>
            <p className="text-xs text-muted-foreground">Thông tin chẩn đoán chỉ đọc từ backend.</p>
          </div>
        </div>
        {state.pagination.totalCount > 0 ? (
          <Badge variant="outline">{state.pagination.totalCount} lần</Badge>
        ) : null}
      </div>

      {state.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : state.errorMessage ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={state.retry}>
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        </div>
      ) : state.attempts.length === 0 ? (
        <p className="rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">Đơn hàng chưa có lần thực thi nào.</p>
      ) : (
        <div className="space-y-2">
          {state.attempts.map((attempt) => {
            const expanded = state.expandedId === attempt.sourceCommandId;
            return (
              <div key={attempt.sourceCommandId} className="overflow-hidden rounded-lg border border-border">
                <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <DiagnosticField label="Lần" value={`#${attempt.dispatchAttemptNo}`} />
                    <DiagnosticField label="Trạng thái lệnh" value={<Badge variant="outline">{attempt.commandStatus}</Badge>} />
                    <DiagnosticField label="Endpoint kiosk" value={<span className="font-mono text-xs">{attempt.kioskExecutionEndpointId}</span>} />
                    <DiagnosticField label="Tạo lúc" value={formatTransactionDate(attempt.createdAt)} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void state.toggleDetail(attempt.sourceCommandId)}>
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    {expanded ? "Thu gọn" : "Chi tiết"}
                  </Button>
                </div>

                {attempt.rejectionCode || attempt.rejectionMessage ? (
                  <div className="mx-3 mb-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {[attempt.rejectionCode, attempt.rejectionMessage].filter(Boolean).join(": ")}
                  </div>
                ) : null}

                {expanded ? (
                  state.isDetailLoading ? (
                    <div className="h-28 animate-pulse border-t border-border bg-muted/30" />
                  ) : state.detailErrorMessage ? (
                    <p className="border-t border-border bg-destructive/5 p-3 text-sm text-destructive">{state.detailErrorMessage}</p>
                  ) : state.detail ? (
                    <AttemptDetail detail={state.detail} />
                  ) : null
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {state.pagination.totalPages > 1 ? (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={!state.pagination.hasPrevious || state.isLoading} onClick={state.previousPage}>Trước</Button>
          <Button variant="outline" size="sm" disabled={!state.pagination.hasNext || state.isLoading} onClick={state.nextPage}>Sau</Button>
        </div>
      ) : null}
    </section>
  );
}
