"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { useOrganizationSales } from "@/hooks/platform/use-organization-sales";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
}

function statusLabel(status: string) {
  if (status === "Active") return "Đang hoạt động";
  if (status === "Suspended") return "Tạm ngưng";
  if (status === "Deactivated") return "Đã ngừng hoạt động";
  return status;
}

export function OrganizationSalesView() {
  const sales = useOrganizationSales();

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Doanh thu theo tổ chức
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Theo dõi số tiền đã thu và hoàn trả ở mức tổng hợp. Trang này không hiển thị khách hàng,
            đơn hàng hoặc giao dịch thanh toán chi tiết của từng tổ chức.
          </p>
        </div>
        <Button variant="outline" onClick={sales.refresh} disabled={sales.isLoading}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">Dữ liệu tổng hợp dành cho quản trị nền tảng</p>
          <p className="mt-1 leading-6 text-muted-foreground">
            Số liệu chỉ gồm đơn đã thanh toán, tổng tiền đã thu, hoàn tiền đã xử lý và thực thu theo tổ chức.
          </p>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Search className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Bộ lọc tổng hợp</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Khoảng ngày được tính theo UTC và tối đa 366 ngày.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[180px_180px_minmax(240px,1fr)_auto] lg:items-end">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Từ ngày</span>
            <Input type="date" value={sales.draft.fromDate} onChange={(event) => sales.updateDraft("fromDate", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Đến ngày</span>
            <Input type="date" value={sales.draft.toDate} onChange={(event) => sales.updateDraft("toDate", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>Tìm tổ chức</span>
            <Input
              value={sales.draft.search}
              onChange={(event) => sales.updateDraft("search", event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") sales.applyFilters(); }}
              placeholder="Tên hoặc mã tổ chức"
            />
          </label>
          <Button onClick={sales.applyFilters} disabled={sales.isLoading}>Áp dụng</Button>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Tổng hợp theo tổ chức</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{sales.pagination.totalCount.toLocaleString("vi-VN")} tổ chức trong kết quả.</p>
            </div>
          </div>
        </CardHeader>

        {sales.error ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">{sales.error}</p>
            <Button variant="outline" onClick={sales.refresh}>Thử lại</Button>
          </div>
        ) : sales.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-muted/40" />)}
          </div>
        ) : sales.items.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Không có doanh thu tổ chức trong khoảng thời gian và bộ lọc đã chọn.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Tổ chức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Đơn đã thanh toán</TableHead>
                <TableHead className="text-right">Tổng đã thu</TableHead>
                <TableHead className="text-right">Đã hoàn trả</TableHead>
                <TableHead className="pr-5 text-right">Thực thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.items.map((item) => (
                <TableRow key={item.organizationId}>
                  <TableCell className="pl-5">
                    <p className="font-medium text-foreground">{item.organizationName}</p>
                    <p className="text-xs text-muted-foreground">{item.organizationCode}</p>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{statusLabel(item.organizationStatus)}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{item.paidOrderCount.toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(item.grossCollectedAmount, item.currency)}</TableCell>
                  <TableCell className="text-right tabular-nums text-warning">{formatMoney(item.processedRefundAmount, item.currency)}</TableCell>
                  <TableCell className="pr-5 text-right font-semibold tabular-nums text-success">{formatMoney(item.netCollectedAmount, item.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-sm text-muted-foreground">Trang {sales.pagination.page || sales.page}/{Math.max(sales.pagination.totalPages, 1)}</p>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" aria-label="Trang trước" disabled={sales.isLoading || !sales.pagination.hasPrevious} onClick={sales.previousPage}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Trang sau" disabled={sales.isLoading || !sales.pagination.hasNext} onClick={sales.nextPage}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
