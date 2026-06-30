import { Eye } from "lucide-react";

import {
  formatTransactionDate,
  formatTransactionMoney,
} from "@/components/features/transactions/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RefundResult, RefundStatus } from "@/types/transactions";

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  Requested: "Đã yêu cầu",
  Processing: "Đang xử lý",
  Processed: "Đã xử lý",
  Rejected: "Từ chối",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
};

const REFUND_STATUS_CLASS_NAMES: Record<RefundStatus, string> = {
  Requested: "border-warning/20 bg-warning/10 text-warning",
  Processing: "border-primary/20 bg-primary/10 text-primary",
  Processed: "border-success/20 bg-success/10 text-success",
  Rejected: "border-destructive/20 bg-destructive/10 text-destructive",
  Failed: "border-destructive/20 bg-destructive/10 text-destructive",
  Cancelled: "border-border bg-muted/20 text-muted-foreground",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge
      variant="outline"
      className={`h-6 rounded-full px-2.5 ${REFUND_STATUS_CLASS_NAMES[status]}`}
    >
      {REFUND_STATUS_LABELS[status]}
    </Badge>
  );
}

interface RefundsTableProps {
  refunds: RefundResult[];
  onViewDetail: (refundId: string) => void;
}

export function RefundsTable({ refunds, onViewDetail }: RefundsTableProps) {
  return (
    <Table className="min-w-[1080px] table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[20%] px-4">Hoàn tiền</TableHead>
          <TableHead className="w-[18%] text-center">Đơn hàng</TableHead>
          <TableHead className="w-[13%] text-center">Trạng thái</TableHead>
          <TableHead className="w-[13%] text-right">Số tiền</TableHead>
          <TableHead className="w-[16%] text-center">Phương thức</TableHead>
          <TableHead className="w-[13%] text-center">Yêu cầu lúc</TableHead>
          <TableHead className="w-[7%] px-4 text-center">Chi tiết</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {refunds.map((refund) => (
          <TableRow key={refund.id} className="hover:bg-muted/30">
            <TableCell className="h-16 px-4 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-mono text-[13px] font-medium text-foreground">
                  {refund.refundNumber}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {refund.reason}
                </p>
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {refund.orderNumber}
              </span>
            </TableCell>
            <TableCell className="py-2.5 text-center">
              <div className="flex justify-center">
                <RefundStatusBadge status={refund.status} />
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-right font-medium tabular-nums">
              {formatTransactionMoney(refund.amount, refund.currency)}
            </TableCell>
            <TableCell className="py-2.5 text-center text-sm text-muted-foreground">
              {refund.refundMethod}
            </TableCell>
            <TableCell className="py-2.5 text-center text-xs tabular-nums text-muted-foreground">
              {formatTransactionDate(refund.requestedAt)}
            </TableCell>
            <TableCell className="px-4 py-2.5 text-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title={`Xem chi tiết ${refund.refundNumber}`}
                aria-label={`Xem chi tiết ${refund.refundNumber}`}
                onClick={() => onViewDetail(refund.id)}
              >
                <Eye className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
