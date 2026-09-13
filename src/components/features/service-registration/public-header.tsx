"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Giải pháp", href: "#giai-phap" },
  { label: "Cách hoạt động", href: "#cach-hoat-dong" },
  { label: "Dành cho đối tác", href: "#doi-tac" },
  { label: "Hệ thống", href: "#he-thong" },
];

export function PublicHeader({
  rootQualifiedAnchors = false,
}: {
  rootQualifiedAnchors?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const menu = mobileMenuRef.current;
    const focusableItems = menu?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    const firstItem = focusableItems?.[0];
    const lastItem = focusableItems?.[focusableItems.length - 1];

    firstItem?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !firstItem || !lastItem) return;

      if (!menu?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastItem : firstItem).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border px-4 transition-[background-color,border-color,box-shadow,color] duration-300 sm:px-5 ${isScrolled ? "border-slate-200 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl" : "border-white/10 bg-[#0B1018]/75 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl"}`}
      >
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className={`text-xl font-bold tracking-[-0.08em] sm:text-2xl ${isScrolled ? "text-[#175CD3]" : "text-white"}`}
          >
            ICEBOT
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Điều hướng chính"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={rootQualifiedAnchors ? `/${link.href}` : link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isScrolled ? "text-[#475467] hover:text-[#182230]" : "text-slate-300 hover:text-white"}`}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/docs"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isScrolled ? "text-[#475467] hover:text-[#182230]" : "text-slate-300 hover:text-white"}`}
            >
              Tài liệu
            </Link>
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "text-sm",
              !isScrolled &&
                "text-slate-200 hover:bg-white/10 hover:text-white",
            )}
          >
            Đăng nhập quản trị
          </Link>
          <a
            href={rootQualifiedAnchors ? "/#dang-ky" : "#dang-ky"}
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-[#175CD3] text-sm hover:bg-[#004EBA]",
            )}
          >
            Trao đổi mô hình triển khai
          </a>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className={`inline-flex size-11 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:hidden ${isScrolled ? "text-[#182230] hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-controls="public-mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label={
            mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
          }
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          id="public-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-4 shadow-lg lg:hidden"
        >
          <nav
            className="flex flex-col"
            aria-label="Điều hướng trên thiết bị di động"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={rootQualifiedAnchors ? `/${link.href}` : link.href}
                className="border-b border-slate-100 px-3 py-3 text-base font-medium text-[#182230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#175CD3]"
                onClick={closeMobileMenu}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/docs"
              className="border-b border-slate-100 px-3 py-3 text-base font-medium text-[#182230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#175CD3]"
              onClick={closeMobileMenu}
            >
              Tài liệu
            </Link>
          </nav>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 w-full",
              )}
              onClick={closeMobileMenu}
            >
              Đăng nhập quản trị
            </Link>
            <a
              href={rootQualifiedAnchors ? "/#dang-ky" : "#dang-ky"}
              className={cn(
                buttonVariants(),
                "h-11 w-full bg-[#175CD3] hover:bg-[#004EBA]",
              )}
              onClick={closeMobileMenu}
            >
              Trao đổi mô hình triển khai
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
