"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileEdit,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useContentPages } from "@/hooks/platform/use-content-pages";
import { hasPermission } from "@/lib/rbac";
import {
  STATIC_CONTENT_PAGE_METADATA,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ContentPagesListView() {
  const { effectiveAccess } = useAuth();
  const { items, isLoading, error, refresh } = useContentPages();

  const canManage = hasPermission(effectiveAccess, "content-pages.manage");

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Quản lý trang nội dung tĩnh
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý nội dung các trang pháp lý, điều khoản sử dụng, chính sách thanh toán và thông tin liên hệ.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách trang nội dung</CardTitle>
          <CardDescription>
            Các trang thông tin dài được hiển thị công khai trên giao diện người dùng và chân trang (Footer).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Tên trang</TableHead>
                <TableHead>Đường dẫn (Slug)</TableHead>
                <TableHead>Tiêu đề nháp / xuất bản</TableHead>
                <TableHead className="w-[180px]">Trạng thái</TableHead>
                <TableHead className="w-[180px]">Lần sửa gần nhất</TableHead>
                <TableHead className="text-right w-[160px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu trang nội dung...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Không có trang nội dung nào.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const staticMeta =
                    STATIC_CONTENT_PAGE_METADATA[item.key as StaticContentPageKey];
                  const pageLabel = staticMeta?.label || item.key;
                  const isPublished = Boolean(item.publishedRevisionId);

                  return (
                    <TableRow key={item.key}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground">{pageLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {staticMeta?.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                          /{item.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-md">
                          <span className="text-sm font-medium text-foreground truncate">
                            {item.draftTitle || "(Chưa có tiêu đề)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isPublished ? (
                          <Badge variant="outline" className="border-success text-success bg-success/10 gap-1 font-normal">
                            <CheckCircle2 className="h-3 w-3" /> Đã xuất bản (v{item.revision})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <Clock className="h-3 w-3" /> Bản nháp (Chưa xuất bản)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${item.slug}`}
                            target="_blank"
                            title="Xem trang công khai"
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/platform/content-pages/${item.key}`}
                            className={buttonVariants({
                              variant: "default",
                              size: "sm",
                              className: "gap-1.5",
                            })}
                          >
                            <FileEdit className="h-4 w-4" />
                            {canManage ? "Chỉnh sửa" : "Xem chi tiết"}
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
