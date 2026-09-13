"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileEdit,
  History,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/identity/use-auth";
import { useContentPageDetail } from "@/hooks/platform/use-content-pages";
import { hasPermission } from "@/lib/rbac";
import {
  STATIC_CONTENT_PAGE_METADATA,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";
import { RichTextEditor } from "@/components/features/platform/content-pages/rich-text-editor";

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

interface ContentPageEditorViewProps {
  pageKey: string;
}

export function ContentPageEditorView({ pageKey }: ContentPageEditorViewProps) {
  const router = useRouter();
  const { effectiveAccess } = useAuth();
  const {
    page,
    isLoading,
    isSaving,
    isPublishing,
    error,
    saveDraft,
    publish,
    refresh,
  } = useContentPageDetail(pageKey);

  const canManage = hasPermission(effectiveAccess, "content-pages.manage");

  const [draftTitle, setDraftTitle] = useState("");
  const [draftBodyHtml, setDraftBodyHtml] = useState("");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const staticMeta =
    STATIC_CONTENT_PAGE_METADATA[pageKey as StaticContentPageKey];
  const pageLabel = staticMeta?.label || pageKey;

  // Initialize form state once page loads
  useEffect(() => {
    if (!page) return;

    const timeoutId = window.setTimeout(() => {
      setDraftTitle(page.draftTitle || staticMeta?.defaultTitle || "");
      setDraftBodyHtml(page.draftBodyHtml || "");
      setHasChanges(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [page, staticMeta]);

  useEffect(() => {
    if (!hasChanges) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasChanges]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTitle(e.target.value);
    setHasChanges(true);
  };

  const handleBodyChange = (html: string) => {
    setDraftBodyHtml(html);
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!draftTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    try {
      await saveDraft({
        title: draftTitle.trim(),
        bodyHtml: draftBodyHtml,
      });
      setHasChanges(false);
      toast.success("Đã lưu bản nháp thành công!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể lưu bản nháp.";
      toast.error(message);
    }
  };

  const handlePublish = async () => {
    if (!draftTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề trước khi xuất bản.");
      return;
    }

    if (!draftBodyHtml.trim()) {
      toast.error("Vui lòng nhập nội dung trang trước khi xuất bản.");
      return;
    }

    try {
      // If there are unsaved draft changes, save draft first before publishing
      let currentRevision = page?.revision ?? 0;
      if (hasChanges) {
        const saved = await saveDraft({
          title: draftTitle.trim(),
          bodyHtml: draftBodyHtml,
        });
        if (typeof saved.revision === "number") {
          currentRevision = saved.revision;
        }
      }

      await publish({ expectedRevision: currentRevision });
      setIsPublishDialogOpen(false);
      setHasChanges(false);
      toast.success(
        "Đã xuất bản trang thành công! Nội dung mới hiện đã hiển thị ngoài website.",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể xuất bản trang.";
      toast.error(message);
    }
  };

  if (isLoading && !page) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Đang tải trang soạn thảo...
          </p>
        </div>
      </div>
    );
  }

  const slug = page?.slug || pageKey;
  const isPublished = Boolean(page?.publishedRevisionId);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={pageLabel}
        description={
          staticMeta?.description ??
          "Soạn thảo và xuất bản nội dung hiển thị công khai."
        }
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/platform/content-pages"
              onClick={(event) => {
                if (hasChanges) {
                  event.preventDefault();
                  setDiscardDialogOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Danh sách nội dung
            </Link>
            <Badge variant="outline" className="font-mono text-xs">
              /{slug}
            </Badge>
            {isPublished ? (
              <Badge
                variant="outline"
                className="gap-1 border-success/30 bg-success/10 text-success"
              >
                <CheckCircle2 className="size-3" /> Đã xuất bản
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" /> Chưa xuất bản
              </Badge>
            )}
          </div>
        }
        actions={
          <>
            <Link
              href={`/${slug}`}
              target="_blank"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
              })}
            >
              <ExternalLink className="h-4 w-4" />
              Xem trang web
            </Link>

            {canManage ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isPublishing}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
                </Button>

                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaving || isPublishing}
                  onClick={() => setIsPublishDialogOpen(true)}
                >
                  <Send className="h-4 w-4" />
                  Xuất bản ngay
                </Button>

                <Dialog
                  open={isPublishDialogOpen}
                  onOpenChange={setIsPublishDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Send className="size-5 text-primary" />
                        Xác nhận xuất bản trang
                      </DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn xuất bản bản nháp hiện tại của
                        trang <strong>{pageLabel}</strong>? Phiên bản này sẽ
                        ngay lập tức được cập nhật cho toàn bộ khách hàng và đối
                        tác trên website.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="my-2 p-3 bg-muted/60 rounded-lg text-sm space-y-1">
                      <p>
                        <strong>Tiêu đề sẽ xuất bản:</strong> {draftTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hệ thống sẽ tự động lưu lại một Revision bất biến để đối
                        soát pháp lý.
                      </p>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsPublishDialogOpen(false)}
                        disabled={isPublishing}
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="gap-2"
                      >
                        {isPublishing ? "Đang xuất bản..." : "Đồng ý xuất bản"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}
          </>
        }
      />

      <MetricStrip>
        <MetricStripItem
          icon={History}
          label="Revision hiện tại"
          value={page?.revision ?? 0}
          description="Giá trị kiểm soát cập nhật đồng thời"
          tone="primary"
        />
        <MetricStripItem
          icon={CheckCircle2}
          label="Trạng thái công khai"
          value={isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
          description="Nội dung khách hàng đang nhìn thấy"
          tone={isPublished ? "success" : "warning"}
        />
        <MetricStripItem
          icon={Save}
          label="Thay đổi chưa lưu"
          value={hasChanges ? "Có" : "Không"}
          description="Lưu nháp trước khi rời trang"
          tone={hasChanges ? "warning" : "neutral"}
        />
        <MetricStripItem
          icon={FileEdit}
          label="Chế độ truy cập"
          value={canManage ? "Chỉnh sửa" : "Chỉ xem"}
          description="Theo quyền content-pages.manage"
          tone={canManage ? "primary" : "neutral"}
        />
      </MetricStrip>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {error} Dữ liệu dự phòng đang được hiển thị; hãy tải lại trước khi
            chỉnh sửa hoặc xuất bản.
          </span>
          <Button variant="outline" size="sm" onClick={refresh}>
            Tải lại dữ liệu
          </Button>
        </div>
      ) : null}

      {/* Main Tabs */}
      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList variant="line" className="w-full border-b border-border">
          <TabsTrigger value="editor" className="flex-none gap-2">
            <FileEdit className="h-4 w-4" />
            Soạn thảo
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-none gap-2">
            <Eye className="h-4 w-4" />
            Xem trước
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex-none gap-2">
            <History className="h-4 w-4" />
            Lịch sử phiên bản
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Soạn thảo */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">
                Nội dung bản nháp (Draft)
              </CardTitle>
              <CardDescription>
                Nội dung soạn thảo dưới đây chỉ hiển thị cho quản trị viên cho
                đến khi bạn bấm &ldquo;Xuất bản ngay&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title input */}
              <div className="space-y-2">
                <Label htmlFor="draft-title" className="font-medium text-sm">
                  Tiêu đề trang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="draft-title"
                  value={draftTitle}
                  onChange={handleTitleChange}
                  placeholder="Nhập tiêu đề trang hiển thị..."
                  disabled={!canManage || isSaving || isPublishing}
                  className="font-medium text-base"
                />
              </div>

              {/* Rich-Text Editor Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">
                    Nội dung chi tiết (HTML Rich-Text)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Hỗ trợ định dạng in đậm, nghiêng, tiêu đề, danh sách, trích
                    dẫn và liên kết
                  </span>
                </div>

                <RichTextEditor
                  content={draftBodyHtml}
                  onChange={handleBodyChange}
                  disabled={!canManage || isSaving || isPublishing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Xem trước (Preview) */}
        <TabsContent value="preview">
          <Card>
            <CardHeader className="border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {draftTitle || "(Chưa có tiêu đề)"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Bản xem trước giao diện người dùng
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Chế độ xem trước
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              {draftBodyHtml ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: draftBodyHtml }}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Chưa có nội dung nào để xem trước. Vui lòng nhập nội dung ở
                  tab &ldquo;Soạn thảo&rdquo;.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Lịch sử phiên bản (Revisions) */}
        <TabsContent value="revisions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Lịch sử các phiên bản đã xuất bản
              </CardTitle>
              <CardDescription>
                Mỗi lần xuất bản sẽ tạo ra một bản ghi Revision bất biến để theo
                dõi và đối soát pháp lý.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="md:hidden">
                {page?.revisions && page.revisions.length > 0 ? (
                  <div className="grid gap-3 p-4">
                    {page.revisions.map((revision) => {
                      const isCurrent =
                        revision.id === page.publishedRevisionId;
                      return (
                        <article
                          key={revision.id}
                          className="space-y-3 rounded-lg border border-border p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono font-semibold">
                              v{revision.revisionNumber}
                            </span>
                            <Badge
                              variant={isCurrent ? "outline" : "secondary"}
                              className={
                                isCurrent
                                  ? "border-success/30 bg-success/10 text-success"
                                  : undefined
                              }
                            >
                              {isCurrent ? "Đang hiển thị" : "Bản cũ"}
                            </Badge>
                          </div>
                          <p className="font-medium text-foreground">
                            {revision.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Xuất bản: {formatDate(revision.publishedAt)}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                ) : page?.revision && isPublished ? (
                  <article className="m-4 space-y-3 rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono font-semibold">
                        v{page.revision}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/10 text-success"
                      >
                        Đang hiển thị
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground">
                      {page.draftTitle || pageLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cập nhật: {formatDate(page.updatedAt)}
                    </p>
                  </article>
                ) : (
                  <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Chưa có phiên bản nào được xuất bản trước đây.
                  </p>
                )}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Phiên bản</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead className="w-[200px]">Ngày xuất bản</TableHead>
                      <TableHead className="w-[140px] text-right">
                        Trạng thái
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {page?.revisions && page.revisions.length > 0 ? (
                      page.revisions.map((rev) => {
                        const isCurrent = rev.id === page.publishedRevisionId;
                        return (
                          <TableRow key={rev.id}>
                            <TableCell className="font-mono font-medium">
                              v{rev.revisionNumber}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {rev.title}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(rev.publishedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {isCurrent ? (
                                <Badge
                                  variant="outline"
                                  className="border-success text-success bg-success/10 font-normal"
                                >
                                  Đang hiển thị
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="font-normal text-xs"
                                >
                                  Bản cũ
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : page?.revision && isPublished ? (
                      <TableRow>
                        <TableCell className="font-mono font-medium">
                          v{page.revision}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {page.draftTitle || pageLabel}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(page.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className="border-success text-success bg-success/10 font-normal"
                          >
                            Đang hiển thị
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          Chưa có phiên bản nào được xuất bản trước đây.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="Bỏ thay đổi chưa lưu?"
        description="Các thay đổi trong bản nháp chưa được lưu. Nếu rời trang, phần nội dung này sẽ bị mất."
        confirmLabel="Bỏ thay đổi và rời trang"
        destructive
        onConfirm={() => {
          setHasChanges(false);
          setDiscardDialogOpen(false);
          router.push("/platform/content-pages");
        }}
      />
    </div>
  );
}
