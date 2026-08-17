"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, FileQuestion, Home, RefreshCw, ShieldCheck } from "lucide-react";
import axios from "axios";

import { PublicHeader } from "@/components/features/service-registration/public-header";
import { PublicFooter } from "@/components/features/service-registration/public-footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { getPublicContentPage } from "@/lib/services/platform/content-pages";
import {
  STATIC_CONTENT_PAGE_METADATA,
  type PublicContentPageResult,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";

interface PublicContentPageViewProps {
  slug: string;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(new Date(value));
}

export function PublicContentPageView({ slug }: PublicContentPageViewProps) {
  const [content, setContent] = useState<PublicContentPageResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const staticMeta =
    STATIC_CONTENT_PAGE_METADATA[slug as StaticContentPageKey];
  const fallbackTitle = staticMeta?.defaultTitle || staticMeta?.label || slug;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadPage() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getPublicContentPage(slug, controller.signal);
        if (isMounted) {
          setContent(result);
        }
      } catch (err: unknown) {
        if (axios.isCancel(err) || controller.signal.aborted) return;
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Không thể tải nội dung trang.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [slug]);

  const pageTitle = content?.title || fallbackTitle;
  const publishedDate = formatDate(content?.publishedAt);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20">
      <PublicHeader />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-foreground font-medium truncate">
              {staticMeta?.label || pageTitle}
            </span>
          </nav>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-6 animate-pulse py-8">
              <div className="h-10 bg-muted rounded-lg w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="space-y-3 pt-6">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
            </div>
          )}

          {/* Error / Empty state */}
          {!isLoading && error && !content && (
            <div className="py-16 text-center space-y-4 border border-border/60 rounded-2xl bg-card p-8 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileQuestion className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Nội dung đang được cập nhật
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Trang <strong>{staticMeta?.label || slug}</strong> hiện chưa có phiên bản xuất bản chính thức hoặc đang được quản trị viên hoàn thiện.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Quay về Trang chủ
                </Link>
              </div>
            </div>
          )}

          {/* Success Content Article */}
          {!isLoading && content && (
            <article className="space-y-8">
              {/* Header Title Section */}
              <div className="border-b border-border pb-6 space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {content.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {publishedDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Cập nhật ngày: {publishedDate}</span>
                    </div>
                  )}
                  {content.revisionNumber && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Phiên bản: v{content.revisionNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Render HTML content safely */}
              <div
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:underline hover:prose-a:opacity-80 prose-p:leading-relaxed prose-img:rounded-xl prose-img:border prose-img:border-border"
                dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
              />
            </article>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
