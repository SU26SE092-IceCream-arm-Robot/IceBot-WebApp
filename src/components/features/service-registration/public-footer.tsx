import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-start justify-between">
          <div className="md:col-span-1">
            <Link href="/" className="font-bold text-2xl tracking-tighter text-primary block mb-2">
              ICEBOT
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hệ thống kiosk bán kem tự động kết hợp robot arm và IoT đa điểm, tối ưu hiệu suất vận hành chuỗi.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Liên kết nhanh
            </h4>
            <a href="/#giai-phap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Giải pháp
            </a>
            <a href="/#he-thong" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Hệ thống
            </a>
            <a href="/#dang-ky" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Đăng ký hợp tác
            </a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Đăng nhập quản trị
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Chính sách & Thông tin
            </h4>
            <Link href="/about-us" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Về chúng tôi
            </Link>
            <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms-of-use" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/payment-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Chính sách thanh toán
            </Link>
            <Link href="/contact-information" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Thông tin liên hệ
            </Link>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          &copy; {currentYear} IceBot. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
