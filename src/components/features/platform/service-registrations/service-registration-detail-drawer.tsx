"use client";

import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Shield,
  Store,
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
  onStartReview: (id: string, revision?: number) => Promise<void>;
  onOpenApprove: (item: ManagementServiceRegistrationDetail) => void;
  onOpenReject: (item: ManagementServiceRegistrationDetail) => void;
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
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="mr-1 size-3" /> Chờ rà soát
        </Badge>
      );
    case "UnderReview":
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Eye className="mr-1 size-3" /> Đang rà soát
        </Badge>
      );
    case "Approved":
    case "Provisioned":
      return (
        <Badge variant="default" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
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
        <Badge variant="destructive" className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <AlertTriangle className="mr-1 size-3" /> Lỗi cấp phát
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function DetailRow({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 sm:grid-cols-[160px_1fr]">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={`break-words text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
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
  onStartReview,
  onOpenApprove,
  onOpenReject,
  onRetryProvisioning,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileCheck2 className="size-5 text-primary" />
                Đơn đăng ký #{item?.referenceCode || "Chi tiết"}
              </DialogTitle>
              <DialogDescription>
                {item ? `Nộp ngày ${formatDateTime(item.submittedAt)} • Phiên bản: v${item.revision}` : "Xem thông tin đơn"}
              </DialogDescription>
            </div>
            {item ? getStatusBadge(item.status) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải thông tin đơn đăng ký...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          ) : item ? (
            <div className="space-y-6 text-sm">
              {/* Alert nếu lỗi provisioning hoặc bị từ chối */}
              {item.status === "ProvisioningFailed" && item.provisioningError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 space-y-1 text-destructive">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <AlertTriangle className="size-4" /> Lỗi cấp phát hệ thống (Provisioning Error)
                  </div>
                  <p className="text-xs break-words">{item.provisioningError}</p>
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

              {/* Nhóm 1: Người liên hệ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5 text-primary" /> Thông tin người liên hệ
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Họ và tên" value={item.contactName} />
                  <DetailRow label="Email" value={item.email} />
                  <DetailRow label="Số điện thoại" value={item.phoneNumber} />
                </div>
              </div>

              {/* Nhóm 2: Doanh nghiệp & Điểm bán */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3.5 text-primary" /> Thông tin cơ sở & Quy mô
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Tên thương hiệu / Cơ sở" value={item.businessName} />
                  <DetailRow label="Tên pháp lý" value={item.legalName} />
                  <DetailRow label="Mã số thuế" value={item.taxCode} />
                  <DetailRow label="Địa chỉ hoạt động" value={item.address} />
                  <DetailRow label="Điểm bán dự kiến" value={item.expectedLocationCount ? `${item.expectedLocationCount} điểm` : "—"} />
                </div>
              </div>

              {/* Nhóm 3: Lời nhắn & Điều khoản */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-3.5 text-primary" /> Lời nhắn & Chính sách
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Lời nhắn đối tác" value={item.message} />
                  <DetailRow label="Đồng ý chính sách" value={item.privacyPolicyAccepted ? "Đã đồng ý" : "Chưa đồng ý"} />
                  <DetailRow label="Privacy Policy Revision" value={item.privacyPolicyRevisionId} mono />
                </div>
              </div>

              {/* Nhóm 4: Lịch sử xét duyệt & Cấp phát */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                  <Shield className="size-3.5 text-primary" /> Lịch sử xét duyệt & Cấp phát
                </div>
                <div className="rounded-lg border bg-card/60 p-3.5 space-y-0.5">
                  <DetailRow label="Người rà soát" value={item.reviewedBy} />
                  <DetailRow label="Thời gian rà soát" value={formatDateTime(item.reviewedAt)} />
                  <DetailRow label="Mã tổ chức tạo" value={item.provisionedOrganizationId} mono />
                  <DetailRow label="Tài khoản Admin tạo" value={item.provisionedAdminUserId} mono />
                  <DetailRow label="Trạng thái cấp phát" value={item.provisioningStatus} />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {item && !loading ? (
          <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex-row justify-end gap-2">
            {item.status === "Submitted" ? (
              <Button
                type="button"
                isLoading={actionLoading}
                onClick={() => void onStartReview(item.id, item.revision)}
                className="gap-1.5"
              >
                <Eye className="size-4" />
                Bắt đầu rà soát
              </Button>
            ) : null}

            {item.status === "UnderReview" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={actionLoading}
                  onClick={() => onOpenReject(item)}
                >
                  <XCircle className="mr-1.5 size-4" />
                  Từ chối
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  disabled={actionLoading}
                  onClick={() => onOpenApprove(item)}
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
                className="gap-1.5"
              >
                <RotateCcw className="size-4" />
                Thử lại cấp phát
              </Button>
            ) : null}

            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
