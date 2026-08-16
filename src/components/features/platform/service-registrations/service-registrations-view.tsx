"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileCheck2,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServiceRegistrations } from "@/hooks/platform/use-service-registrations";
import {
  formatDateTime,
  getStatusBadge,
  ServiceRegistrationDetailDrawer,
} from "@/components/features/platform/service-registrations/service-registration-detail-drawer";
import { ServiceRegistrationApproveDialog } from "@/components/features/platform/service-registrations/service-registration-approve-dialog";
import { ServiceRegistrationRejectDialog } from "@/components/features/platform/service-registrations/service-registration-reject-dialog";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Submitted", label: "Chờ rà soát (Submitted)" },
  { value: "UnderReview", label: "Đang rà soát (UnderReview)" },
  { value: "Approved", label: "Đã phê duyệt (Approved)" },
  { value: "Rejected", label: "Đã từ chối (Rejected)" },
  { value: "ProvisioningFailed", label: "Lỗi cấp phát (ProvisioningFailed)" },
];

export function ServiceRegistrationsView() {
  const state = useServiceRegistrations();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="size-8 text-primary" />
            Đơn đăng ký dịch vụ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý, rà soát và phê duyệt các đơn đăng ký mở điểm bán robot kem tự động IceBot.
          </p>
        </div>
        <Button variant="outline" onClick={state.refresh} disabled={state.isLoading}>
          <RefreshCw className={`mr-2 size-4 ${state.isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </header>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm mã đơn, tên, email, cơ sở..."
                value={state.searchQuery}
                onChange={(e) => state.setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Select */}
            <div>
              <select
                aria-label="Lọc theo trạng thái đơn đăng ký"
                value={state.statusFilter}
                onChange={(e) => state.setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={state.createdFrom}
                onChange={(e) => state.setCreatedFrom(e.target.value)}
                className="pl-9 text-xs"
                title="Từ ngày"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={state.createdTo}
                onChange={(e) => state.setCreatedTo(e.target.value)}
                className="pl-9 text-xs"
                title="Đến ngày"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="border-b border-border py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              Danh sách đăng ký ({state.pagination.totalCount})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {state.error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <AlertTriangle className="mb-3 size-9 text-destructive" />
              <p className="font-medium text-destructive">{state.error}</p>
              <Button variant="outline" className="mt-4" onClick={state.refresh}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[14%]">Mã đơn</TableHead>
                    <TableHead className="w-[18%]">Người liên hệ</TableHead>
                    <TableHead className="w-[20%]">Thương hiệu / Cơ sở</TableHead>
                    <TableHead className="w-[18%]">Email & SĐT</TableHead>
                    <TableHead className="w-[14%] text-center">Trạng thái</TableHead>
                    <TableHead className="w-[10%] text-center">Ngày nộp</TableHead>
                    <TableHead className="w-[6%] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                        <RefreshCw className="inline-block size-6 animate-spin mr-2 text-primary" />
                        Đang tải danh sách đơn đăng ký...
                      </TableCell>
                    </TableRow>
                  ) : state.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                        <Store className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                        Không tìm thấy đơn đăng ký dịch vụ nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono font-bold text-primary">
                          <button
                            type="button"
                            onClick={() => void state.openDetail(item.id)}
                            className="hover:underline text-left"
                          >
                            {item.referenceCode}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">{item.contactName}</span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.businessName}</div>
                          {item.expectedLocationCount ? (
                            <span className="text-xs text-muted-foreground">
                              {item.expectedLocationCount} điểm bán dự kiến
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-foreground">{item.email}</div>
                          {item.phoneNumber ? (
                            <div className="text-xs text-muted-foreground">{item.phoneNumber}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {formatDateTime(item.submittedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void state.openDetail(item.id)}
                              title="Xem chi tiết"
                              className="h-8 px-2"
                            >
                              <Eye className="size-4" />
                            </Button>
                            {item.status === "Submitted" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void state.startReview(item.id, item.revision)}
                                disabled={state.actionLoading}
                                title="Bắt đầu rà soát"
                                className="h-8 px-2 text-xs"
                              >
                                Rà soát
                              </Button>
                            ) : null}
                            {item.status === "UnderReview" ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => void state.openDetail(item.id)}
                                title="Xử lý duyệt"
                                className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                              >
                                Duyệt
                              </Button>
                            ) : null}
                            {item.status === "ProvisioningFailed" ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => void state.retryProvisioning(item.id, item.revision)}
                                disabled={state.actionLoading}
                                title="Thử lại cấp phát"
                                className="h-8 px-2 text-xs"
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <span className="text-xs text-muted-foreground">
              Trang {state.pagination.page} / {Math.max(1, state.pagination.totalPages)} (Tổng{" "}
              {state.pagination.totalCount} đơn)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={state.previousPage}
                disabled={!state.pagination.hasPrevious || state.isLoading}
              >
                <ChevronLeft className="size-4" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={state.nextPage}
                disabled={!state.pagination.hasNext || state.isLoading}
              >
                Sau <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <ServiceRegistrationDetailDrawer
        open={state.detailOpen}
        onOpenChange={state.closeDetail}
        item={state.selectedDetail}
        loading={state.detailLoading}
        error={state.detailError}
        actionLoading={state.actionLoading}
        onStartReview={state.startReview}
        onOpenApprove={state.openApproveDialog}
        onOpenReject={state.openRejectDialog}
        onRetryProvisioning={state.retryProvisioning}
      />

      {/* Approve Dialog */}
      <ServiceRegistrationApproveDialog
        open={state.approveDialogOpen}
        onOpenChange={state.setApproveDialogOpen}
        item={state.targetForApprove}
        loading={state.actionLoading}
        onApprove={state.approve}
      />

      {/* Reject Dialog */}
      <ServiceRegistrationRejectDialog
        open={state.rejectDialogOpen}
        onOpenChange={state.setRejectDialogOpen}
        item={state.targetForReject}
        loading={state.actionLoading}
        onReject={state.reject}
      />
    </div>
  );
}
