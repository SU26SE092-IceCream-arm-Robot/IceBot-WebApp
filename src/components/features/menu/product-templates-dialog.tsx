"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Copy, LayoutTemplate, Search } from "lucide-react";

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
import type { MenuManagementPagination, ProductResult } from "@/types/menu-management";

interface ProductTemplatesDialogProps {
  open: boolean;
  organizationName: string;
  searchTerm: string;
  templates: ProductResult[];
  pagination: MenuManagementPagination;
  isLoading: boolean;
  errorMessage: string | null;
  cloningTemplateId: string | null;
  onOpenChange: (open: boolean) => void;
  onSearchTermChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRetry: () => void;
  onClone: (template: ProductResult) => void;
}

export function ProductTemplatesDialog({
  open,
  organizationName,
  searchTerm,
  templates,
  pagination,
  isLoading,
  errorMessage,
  cloningTemplateId,
  onOpenChange,
  onSearchTermChange,
  onPreviousPage,
  onNextPage,
  onRetry,
  onClone,
}: ProductTemplatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <LayoutTemplate className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Tạo sản phẩm từ mẫu</DialogTitle>
              <DialogDescription>
                Chọn mẫu toàn cục để tạo bản sao thuộc tổ chức {organizationName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Tìm theo tên hoặc mã mẫu..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <LayoutTemplate className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Chưa có mẫu sản phẩm</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Không có mẫu sản phẩm phù hợp với tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{template.displayName || template.name}</p>
                    <Badge variant="outline">{template.variants.length} phiên bản</Badge>
                    {!template.isAvailable ? <Badge variant="secondary">Không khả dụng</Badge> : null}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{template.code}</p>
                  {template.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  isLoading={cloningTemplateId === template.id}
                  disabled={cloningTemplateId !== null}
                  onClick={() => onClone(template)}
                >
                  <Copy className="size-4" />
                  Tạo từ mẫu
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:items-center">
          <p className="text-muted-foreground">
            Trang <span className="font-medium text-foreground">{pagination.page}</span> / {Math.max(pagination.totalPages, 1)} · {pagination.totalCount} mẫu
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={onPreviousPage}>
              <ChevronLeft className="size-4" /> Trước
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={onNextPage}>
              Sau <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
