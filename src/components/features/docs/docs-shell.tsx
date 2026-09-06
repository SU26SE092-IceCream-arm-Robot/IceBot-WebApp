"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";

import { DocsChatWidget } from "@/components/features/docs/docs-chat-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DOCS_GROUPS,
  DOCS_PAGES,
  getDocsHref,
  getDocsPage,
} from "@/lib/docs/content";

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSlug = pathname === "/docs" ? "" : pathname.replace(/^\/docs\/?/, "");
  const currentPage = getDocsPage(currentSlug) ?? DOCS_PAGES[0];

  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return DOCS_PAGES;

    return DOCS_PAGES.filter((page) =>
      [page.title, page.description, page.navigationLabel, page.group]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery),
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    function handleSearchShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const navigation = (
    <nav aria-label="Chuyên mục tài liệu" className="space-y-6">
      {DOCS_GROUPS.map((group) => (
        <div key={group}>
          <h2 className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group}
          </h2>
          <ul className="mt-2 space-y-1">
            {DOCS_PAGES.filter((page) => page.group === group).map((page) => {
              const href = getDocsHref(page.slug);
              const active = pathname === href;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavigationOpen(false)}
                  >
                    {page.navigationLabel}
                    {active ? <ChevronRight className="size-4" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#docs-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Bỏ qua điều hướng, tới nội dung tài liệu
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavigationOpen(true)}
            aria-label="Mở menu tài liệu"
          >
            <Menu className="size-5" />
          </Button>

          <Link href="/docs" className="flex shrink-0 items-center gap-3" aria-label="Trang chủ tài liệu IceBot">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-[-0.04em] text-primary-foreground">
              IB
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="font-bold tracking-[-0.04em]">ICEBOT</span>
              <span className="h-4 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">Docs</span>
            </span>
          </Link>

          <button
            type="button"
            className="mx-auto flex h-10 min-w-0 max-w-md flex-1 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            onClick={() => setSearchOpen(true)}
            aria-label="Tìm kiếm tài liệu"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">Tìm trong tài liệu...</span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline">/</kbd>
          </button>

          <Link
            href="/"
            className="hidden min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
          >
            IceBot
            <ArrowUpRight className="size-4" />
          </Link>
          <Link
            href="/login"
            className="flex min-h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,48rem)_14rem]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto border-r border-border px-4 py-7 lg:block">
          {navigation}
        </aside>

        <main id="docs-content" className="min-w-0 px-5 py-9 sm:px-8 lg:px-10 lg:py-12" tabIndex={-1}>
          {children}
        </main>

        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] border-l border-border px-6 py-8 xl:block">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Trong trang này</h2>
          <nav className="mt-3" aria-label="Mục lục trang">
            <ul className="space-y-1">
              {currentPage.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-md px-2 py-2 text-xs leading-5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {mobileNavigationOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu tài liệu">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/45"
            onClick={() => setMobileNavigationOpen(false)}
            aria-label="Đóng menu tài liệu"
          />
          <aside className="relative h-full w-[min(20rem,88vw)] overflow-y-auto border-r border-border bg-background px-4 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">Tài liệu IceBot</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileNavigationOpen(false)} aria-label="Đóng menu tài liệu">
                <X className="size-5" />
              </Button>
            </div>
            {navigation}
          </aside>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Tìm kiếm tài liệu">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm" />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nhập tên chủ đề cần tìm..."
                className="h-14 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                aria-label="Từ khóa tìm kiếm"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm">
                <X className="size-5" />
              </Button>
            </div>
            <div className="max-h-[22rem] overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                searchResults.map((page) => (
                  <Link
                    key={page.slug}
                    href={getDocsHref(page.slug)}
                    className="flex items-start justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-accent"
                    onClick={() => setSearchOpen(false)}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{page.title}</span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{page.description}</span>
                    </span>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">Không tìm thấy chủ đề phù hợp.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <DocsChatWidget />
    </div>
  );
}
