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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
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
    saveDraft,
    publish,
    refresh,
  } = useContentPageDetail(pageKey);

  const canManage = hasPermission(effectiveAccess, "content-pages.manage");

  const [draftTitle, setDraftTitle] = useState("");
  const [draftBodyHtml, setDraftBodyHtml] = useState("");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const staticMeta =
    STATIC_CONTENT_PAGE_METADATA[pageKey as StaticContentPageKey];
  const pageLabel = staticMeta?.label || pageKey;

  // Initialize form state once page loads
  useEffect(() => {
    if (page) {
      setDraftTitle(page.draftTitle || staticMeta?.defaultTitle || "");
      setDraftBodyHtml(page.draftBodyHtml || "");
      setHasChanges(false);
    }
  }, [page, staticMeta]);

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
      const message = err instanceof Error ? err.message : "Không thể lưu bản nháp.";
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
      toast.success("Đã xuất bản trang thành công! Nội dung mới hiện đã hiển thị ngoài website.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể xuất bản trang.";
      toast.error(message);
    }
  };

  if (isLoading && !page) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải trang soạn thảo...</p>
        </div>
      </div>
    );
  }

  const slug = page?.slug || pageKey;
  const isPublished = Boolean(page?.publishedRevisionId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/platform/content-pages")}
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {pageLabel}
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                /{slug}
              </Badge>
              {isPublished ? (
                <Badge variant="outline" className="border-success text-success bg-success/10 gap-1 font-normal">
                  <CheckCircle2 className="h-3 w-3" /> Đã xuất bản
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Clock className="h-3 w-3" /> Chưa xuất bản
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {staticMeta?.description}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
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

          {canManage && (
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
                      <Sparkles className="h-5 w-5 text-primary" />
                      Xác nhận xuất bản trang
                    </DialogTitle>
                    <DialogDescription>
                      Bạn có chắc chắn muốn xuất bản bản nháp hiện tại của trang{" "}
                      <strong>{pageLabel}</strong>? Phiên bản này sẽ ngay lập tức được cập nhật cho toàn bộ khách hàng và đối tác trên website.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="my-2 p-3 bg-muted/60 rounded-lg text-sm space-y-1">
                    <p>
                      <strong>Tiêu đề sẽ xuất bản:</strong> {draftTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hệ thống sẽ tự động lưu lại một Revision bất biến để đối soát pháp lý.
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
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="editor" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Soạn thảo
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Xem trước
          </TabsTrigger>
          <TabsTrigger value="revisions" className="gap-2">
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
                Nội dung soạn thảo dưới đây chỉ hiển thị cho quản trị viên cho đến khi bạn bấm &ldquo;Xuất bản ngay&rdquo;.
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
                    Hỗ trợ định dạng in đậm, nghiêng, tiêu đề, danh sách, trích dẫn và liên kết
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
            <CardContent className="p-8">
              {draftBodyHtml ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: draftBodyHtml }}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Chưa có nội dung nào để xem trước. Vui lòng nhập nội dung ở tab &ldquo;Soạn thảo&rdquo;.
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
                Mỗi lần xuất bản sẽ tạo ra một bản ghi Revision bất biến để theo dõi và đối soát pháp lý.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Phiên bản</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="w-[200px]">Ngày xuất bản</TableHead>
                    <TableHead className="w-[140px] text-right">Trạng thái</TableHead>
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
                              <Badge variant="outline" className="border-success text-success bg-success/10 font-normal">
                                Đang hiển thị
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-normal text-xs">
                                Bản cũ
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : page?.revision ? (
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
                        <Badge variant="outline" className="border-success text-success bg-success/10 font-normal">
                          Đang hiển thị
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                        Chưa có phiên bản nào được xuất bản trước đây.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
