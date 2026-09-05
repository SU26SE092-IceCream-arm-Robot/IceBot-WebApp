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
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  const publishedCount = items.filter(
    (item) => item.publishedRevisionId,
  ).length;
  const draftOnlyCount = items.length - publishedCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý trang nội dung tĩnh"
        description="Quản lý bản nháp, trạng thái xuất bản và nội dung pháp lý hiển thị công khai."
        actions={
          <Button variant="outline" onClick={refresh} isLoading={isLoading}>
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        }
      />

      <MetricStrip>
        <MetricStripItem
          icon={FileText}
          label="Tổng số trang"
          value={items.length}
          description="Danh mục nội dung công khai"
          tone="primary"
        />
        <MetricStripItem
          icon={CheckCircle2}
          label="Đã xuất bản"
          value={publishedCount}
          description="Có phiên bản công khai"
          tone="success"
        />
        <MetricStripItem
          icon={Clock}
          label="Chỉ có bản nháp"
          value={draftOnlyCount}
          description="Chưa có phiên bản công khai"
          tone={draftOnlyCount > 0 ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={FileEdit}
          label="Quyền chỉnh sửa"
          value={canManage ? "Có" : "Chỉ xem"}
          description="Theo quyền content-pages.manage"
          tone={canManage ? "primary" : "neutral"}
        />
      </MetricStrip>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Thử tải lại
          </Button>
        </div>
      ) : null}

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách trang nội dung</CardTitle>
          <CardDescription>
            Các trang thông tin dài được hiển thị công khai trên giao diện người
            dùng và chân trang (Footer).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="md:hidden">
            {isLoading && items.length === 0 ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-lg border border-border bg-muted/30"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                Không có trang nội dung nào.
              </p>
            ) : (
              <div className="grid gap-3 p-4">
                {items.map((item) => {
                  const staticMeta =
                    STATIC_CONTENT_PAGE_METADATA[
                      item.key as StaticContentPageKey
                    ];
                  const pageLabel = staticMeta?.label || item.key;
                  const isPublished = Boolean(item.publishedRevisionId);

                  return (
                    <article
                      key={item.key}
                      className="space-y-3 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {pageLabel}
                          </p>
                          <code className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                            /{item.slug}
                          </code>
                        </div>
                        {isPublished ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-success/30 bg-success/10 text-success"
                          >
                            <CheckCircle2 className="size-3" />v{item.revision}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="size-3" /> Bản nháp
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tiêu đề bản nháp
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium">
                          {item.draftTitle || "Chưa có tiêu đề"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sửa gần nhất: {formatDate(item.updatedAt)}
                      </p>
                      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                        <Link
                          href={`/${item.slug}`}
                          target="_blank"
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          <ExternalLink className="size-4" />
                          Trang công khai
                        </Link>
                        <Link
                          href={`/platform/content-pages/${item.key}`}
                          className={buttonVariants({ size: "sm" })}
                        >
                          <FileEdit className="size-4" />
                          {canManage ? "Chỉnh sửa" : "Xem chi tiết"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Tên trang</TableHead>
                  <TableHead>Đường dẫn (Slug)</TableHead>
                  <TableHead>Tiêu đề nháp / xuất bản</TableHead>
                  <TableHead className="w-[180px]">Trạng thái</TableHead>
                  <TableHead className="w-[180px]">Lần sửa gần nhất</TableHead>
                  <TableHead className="text-right w-[160px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Đang tải dữ liệu trang nội dung...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không có trang nội dung nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const staticMeta =
                      STATIC_CONTENT_PAGE_METADATA[
                        item.key as StaticContentPageKey
                      ];
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
                            <Badge
                              variant="outline"
                              className="border-success text-success bg-success/10 gap-1 font-normal"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Đã xuất bản
                              (v{item.revision})
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="gap-1 font-normal"
                            >
                              <Clock className="h-3 w-3" /> Bản nháp (Chưa xuất
                              bản)
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
