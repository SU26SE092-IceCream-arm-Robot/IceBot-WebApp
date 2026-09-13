import { Apple, Download, Monitor, Terminal } from "lucide-react";

import { OperationalSystemMap } from "@/components/features/service-registration/operational-system-map";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DEFAULT_FAIROBOT_STUDIO_DOWNLOAD_URL =
  "https://github.com/SU26SE092-IceCream-arm-Robot/Fairino-Studio/releases";

const downloadUrl = (
  process.env.NEXT_PUBLIC_FAIROBOT_STUDIO_DOWNLOAD_URL ??
  DEFAULT_FAIROBOT_STUDIO_DOWNLOAD_URL
).trim();

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#05070A] pb-20 pt-32 text-white sm:pt-36 lg:flex lg:items-center lg:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(64,221,255,0.15),transparent_30%),radial-gradient(circle_at_14%_40%,rgba(55,94,255,0.18),transparent_34%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,auto,48px_48px,48px_48px]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0B1018] to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="relative z-10 max-w-2xl lg:col-span-6">
          <p className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" data-hero-motion>
            FaiRobot Studio × IceBot Platform
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-[5.2rem]" data-hero-motion>
            Biến workflow thành một điểm bán <span className="bg-gradient-to-r from-cyan-200 via-white to-indigo-200 bg-clip-text text-transparent">đang vận hành.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300" data-hero-motion>
            Thiết kế và quan sát quy trình trước khi triển khai. IceBot kết nối workflow, quản trị đa điểm bán, thanh toán, máy biên và robot trong một hệ thống thống nhất.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-hero-motion>
            {downloadUrl ? (
              <a href={downloadUrl} className={cn(buttonVariants({ size: "lg" }), "h-12 bg-white px-5 text-base text-[#080B10] shadow-[0_0_35px_rgba(125,230,255,0.22)] hover:bg-cyan-50")}>
                <Download className="size-4" aria-hidden="true" />Tải FaiRobot Studio cho Windows
              </a>
            ) : (
              <span aria-disabled="true" className={cn(buttonVariants({ size: "lg" }), "h-12 cursor-not-allowed bg-white/80 px-5 text-base text-[#080B10]")}>
                <Download className="size-4" aria-hidden="true" />FaiRobot Studio sắp phát hành
              </span>
            )}
            <a href="#cach-hoat-dong" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 border-white/20 bg-white/5 px-5 text-base text-white hover:bg-white/10 hover:text-white")}>Xem hành trình triển khai</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-400" data-hero-motion>
            <span className="flex items-center gap-1.5"><Monitor className="size-4 text-cyan-300" />Windows 10/11</span>
            <span className="flex items-center gap-1.5"><Apple className="size-4" />macOS — Coming soon</span>
            <span className="flex items-center gap-1.5"><Terminal className="size-4" />Linux — Coming soon</span>
          </div>
          <p className="mt-7 border-l border-cyan-300/40 pl-4 text-sm leading-6 text-slate-400">IceBot cung cấp nền tảng phần mềm và giải pháp tích hợp; không cung cấp cánh tay robot.</p>
        </div>
        <div className="lg:col-span-6"><OperationalSystemMap /></div>
      </div>
    </section>
  );
}
