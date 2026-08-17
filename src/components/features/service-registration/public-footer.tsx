import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center justify-between">
          <div>
            <Link href="/" className="font-bold text-2xl tracking-tighter text-primary block mb-2">
              ICEBOT
            </Link>
            <p className="text-muted-foreground">
              Multi-Location Automated Ice Cream Vending System
            </p>
          </div>
          
          <div className="flex flex-wrap md:justify-end gap-6">
            <a href="#giai-phap" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Giải pháp
            </a>
            <a href="#he-thong" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Hệ thống
            </a>
            <a href="#dang-ky" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Đăng ký
            </a>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Đăng nhập quản trị
            </Link>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          &copy; {currentYear} IceBot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
