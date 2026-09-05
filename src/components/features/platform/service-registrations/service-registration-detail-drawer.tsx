"use client";

import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  LoaderCircle,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";

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
import type {
  ManagementServiceRegistrationDetail,
  ServiceRegistrationStatus,
} from "@/types/service-registrations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ManagementServiceRegistrationDetail | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  onOpenApprove: (item: ManagementServiceRegistrationDetail) => Promise<void>;
  onOpenReject: (item: ManagementServiceRegistrationDetail) => Promise<void>;
  onRetryProvisioning: (id: string, revision?: number) => Promise<void>;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusBadge(status: ServiceRegistrationStatus) {
  switch (status) {
    case "Submitted":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        >
          <Clock className="mr-1 size-3" /> Chờ rà soát
        </Badge>
      );
    case "UnderReview":
      return (
        <Badge
          variant="default"
          className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
        >
          <Eye className="mr-1 size-3" /> Đang rà soát
        </Badge>
      );
    case "Approved":
    case "Provisioned":
      return (
        <Badge
          variant="default"
          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
        >
          <CheckCircle2 className="mr-1 size-3" /> Đã phê duyệt
        </Badge>
      );
    case "Rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 size-3" /> Đã từ chối
        </Badge>
      );
    case "ProvisioningFailed":
      return (
        <Badge
          variant="destructive"
          className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <AlertTriangle className="mr-1 size-3" /> Lỗi cấp phát
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 sm:grid-cols-[160px_1fr]">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`break-words text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </dd>
    </div>
  );
}

export function ServiceRegistrationDetailDrawer({
  open,
  onOpenChange,
  item,
  loading,
  error,
  actionLoading,
  onOpenApprove,
  onOpenReject,
  onRetryProvisioning,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(860px,calc(100vh-3rem))] w-[calc(100vw-3rem)] max-w-6xl flex-col overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-8 py-6">
          <div className="flex flex-wrap items-start justify-between gap-5 pr-8">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <FileCheck2 className="size-5 text-primary" />
                Đơn đăng ký #{item?.referenceCode || "Chi tiết"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {item
                  ? `Nộp ${formatDateTime(item.submittedAt)} · Đánh giá hồ sơ và quyết định cấp phát.`
                  : "Đánh giá hồ sơ đăng ký"}
              </DialogDescription>
            </div>
            {item ? getStatusBadge(item.status) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Đang tải thông tin đơn đăng ký...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          ) : item ? (
            <div className="grid gap-6 text-sm xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
              {/* Alert nếu lỗi provisioning hoặc bị từ chối */}
              <div className="space-y-6">
              {item.status === "ProvisioningFailed" &&
              item.provisioningError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 space-y-1 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertTriangle className="size-4" /> Lỗi cấp phát hệ thống
                    (Provisioning Error)
                  </div>
                  <p className="text-xs break-words">
                    {item.provisioningError}
                  </p>
                </div>
              ) : null}

              {item.status === "Rejected" && item.rejectionReason ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 space-y-1 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <XCircle className="size-4" /> Lý do từ chối
                  </div>
                  <p className="text-xs break-words">{item.rejectionReason}</p>
                </div>
              ) : null}

              {/* Evidence required to make the decision. */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5 text-primary" /> Thông tin người
                  liên hệ
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Họ và tên" value={item.contactName} />
                  <DetailRow label="Email" value={item.email} />
                  <DetailRow label="Số điện thoại" value={item.phoneNumber} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3.5 text-primary" /> Thông tin cơ
                  sở & Quy mô
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow
                    label="Tên thương hiệu / Cơ sở"
                    value={item.businessName}
                  />
                  <DetailRow label="Tên pháp lý" value={item.legalName} />
                  <DetailRow label="Mã số thuế" value={item.taxCode} />
                  <DetailRow label="Địa chỉ hoạt động" value={item.address} />
                  <DetailRow
                    label="Điểm bán dự kiến"
                    value={
                      item.expectedLocationCount
                        ? `${item.expectedLocationCount} điểm`
                        : "—"
                    }
                  />
                </div>
              </div>

              </div>
              <aside className="space-y-5 rounded-xl border bg-muted/10 p-5 xl:sticky xl:top-0 xl:self-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quyết định</p>
                  <p className="mt-1 text-sm font-medium">
                    {item.status === "Submitted"
                      ? "Kiểm tra hồ sơ rồi chọn phê duyệt hoặc từ chối."
                      : item.status === "UnderReview"
                        ? "Hồ sơ đang chờ quyết định cấp phát."
                        : "Kiểm tra trạng thái và điều kiện hồ sơ."}
                  </p>
                </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-3.5 text-primary" /> Lời nhắn &
                  Chính sách
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Lời nhắn đối tác" value={item.message} />
                  <DetailRow
                    label="Đồng ý chính sách"
                    value={
                      item.privacyPolicyAccepted ? "Đã đồng ý" : "Chưa đồng ý"
                    }
                  />
                </div>
              </div>

              <details className="group rounded-lg border bg-card/60 p-3.5">
                <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit và cấp phát</summary>
                <dl className="mt-3 space-y-0.5">
                  <DetailRow label="Người rà soát" value={item.reviewedBy} />
                  <DetailRow
                    label="Thời gian rà soát"
                    value={formatDateTime(item.reviewedAt)}
                  />
                  <DetailRow
                    label="Mã tổ chức tạo"
                    value={item.provisionedOrganizationId}
                    mono
                  />
                  <DetailRow
                    label="Tài khoản Admin tạo"
                    value={item.provisionedAdminUserId}
                    mono
                  />
                  <DetailRow
                    label="Trạng thái cấp phát"
                    value={item.provisioningStatus}
                  />
                  <DetailRow label="Policy revision" value={item.privacyPolicyRevisionId} mono />
                </dl>
              </details>
              </aside>
            </div>
          ) : null}
        </div>

        {item && !loading ? (
          <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-3 rounded-none border-x-0 border-b-0 bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
            <p className="hidden text-xs leading-relaxed text-muted-foreground lg:block">
              Thao tác sẽ được ghi nhận vào lịch sử xét duyệt.
            </p>
            <div className="flex w-full flex-col-reverse gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              disabled={actionLoading}
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>

            {item.status === "Submitted" || item.status === "UnderReview" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full text-destructive hover:bg-destructive/10 sm:min-w-28 sm:w-auto"
                  disabled={actionLoading}
                  onClick={() => void onOpenReject(item)}
                >
                  <XCircle className="mr-1.5 size-4" />
                  Từ chối
                </Button>
                <Button
                  type="button"
                  className="h-11 w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 sm:min-w-48 sm:w-auto"
                  disabled={actionLoading}
                  onClick={() => void onOpenApprove(item)}
                >
                  <CheckCircle2 className="size-4" />
                  Phê duyệt & Cấp phát
                </Button>
              </>
            ) : null}

            {item.status === "ProvisioningFailed" ? (
              <Button
                type="button"
                variant="destructive"
                isLoading={actionLoading}
                onClick={() => void onRetryProvisioning(item.id, item.revision)}
                className="h-11 w-full gap-1.5 sm:w-auto"
              >
                <RotateCcw className="size-4" />
                Thử lại cấp phát
              </Button>
            ) : null}
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
