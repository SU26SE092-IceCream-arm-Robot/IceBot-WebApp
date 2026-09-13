import Link from "next/link";

const quickLinks = [
  ["Tài liệu", "/docs"],
  ["Giải pháp", "/#giai-phap"],
  ["Hành trình", "/#cach-hoat-dong"],
  ["Hệ thống", "/#he-thong"],
  ["Đăng ký triển khai", "/#dang-ky"],
] as const;

const policyLinks = [
  ["Về chúng tôi", "/about-us"],
  ["Chính sách bảo mật", "/privacy-policy"],
  ["Điều khoản sử dụng", "/terms-of-use"],
  ["Thông tin liên hệ", "/contact-information"],
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#05070A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold tracking-[-0.04em]">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white text-xs text-[#05070A]">IB</span>ICEBOT
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">Nền tảng biến workflow mô phỏng thành hệ thống bán hàng tự động có thể quản trị và mở rộng.</p>
          </div>
          <nav className="grid grid-cols-2 gap-8 lg:col-span-6" aria-label="Liên kết chân trang">
            <div><h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Khám phá</h2><ul className="mt-5 space-y-3">{quickLinks.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-slate-300 transition-colors hover:text-white">{label}</Link></li>)}</ul></div>
            <div><h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Thông tin</h2><ul className="mt-5 space-y-3">{policyLinks.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-slate-300 transition-colors hover:text-white">{label}</Link></li>)}<li><Link href="/login" className="text-sm text-slate-300 transition-colors hover:text-white">Đăng nhập quản trị</Link></li></ul></div>
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} IceBot. All rights reserved.</span>
          <span>Software platform for robot-powered retail.</span>
        </div>
      </div>
    </footer>
  );
}
