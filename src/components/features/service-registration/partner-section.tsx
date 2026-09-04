import { ArrowUpRight, Building2, MapPinned, Store } from "lucide-react";

const profiles = [
  [Building2, "01", "Nhà vận hành nhiều địa điểm", "Cần một cách nhìn tập trung khi phạm vi kiosk và vận hành tăng lên."],
  [Store, "02", "Đối tác địa điểm hoặc nhượng quyền", "Đang đánh giá mô hình tự động hóa bán lẻ cho không gian có nhu cầu phục vụ."],
  [MapPinned, "03", "Doanh nghiệp đang khảo sát triển khai", "Muốn làm rõ phạm vi, vận hành và điều kiện cần thiết trước khi quyết định."],
] as const;

export function PartnerSection() {
  return (
    <section id="doi-tac" className="scroll-mt-20 overflow-hidden bg-white py-20 sm:py-24 lg:py-32" data-landing-reveal>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#175CD3]">Dành cho người tiên phong</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#101828] sm:text-5xl lg:text-6xl">
              Ý tưởng đã có.<br /><span className="text-slate-400">Lộ trình thì chưa.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#475467]">
              IceBot phù hợp với đội ngũ nhìn thấy tiềm năng của bán hàng tự động bằng robot, nhưng cần một hệ thống để biến ý tưởng thành vận hành thực tế.
            </p>
            <a href="#dang-ky" className="mt-8 inline-flex items-center gap-2 border-b border-[#101828] pb-1 text-sm font-semibold text-[#101828] transition-colors hover:border-[#175CD3] hover:text-[#175CD3]">
              Trao đổi mô hình của bạn <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <ol className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-7">
            {profiles.map(([Icon, number, title, description]) => (
              <li key={title} className="group grid gap-5 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-start" data-reveal-item>
                <span className="font-mono text-xs text-slate-400">{number}</span>
                <div>
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-[#175CD3]" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-[#182230]">{title}</h3>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">{description}</p>
                </div>
                <ArrowUpRight className="hidden size-5 text-slate-300 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#175CD3] sm:block" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
