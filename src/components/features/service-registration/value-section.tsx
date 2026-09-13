import { Activity, Boxes, ShieldCheck, Store } from "lucide-react";

const capabilities = [
  {
    icon: Store,
    title: "Kiểm soát đa địa điểm",
    description: "Tổ chức, điểm bán và kiosk được đặt trong cùng một phạm vi quản trị rõ ràng.",
    evidence: ["Tổ chức và cửa hàng", "Kiosk theo từng điểm bán", "Phạm vi người dùng"],
  },
  {
    icon: Activity,
    title: "Phản ứng theo thời gian thực",
    description: "Trạng thái, sự kiện và cảnh báo giúp đội ngũ nhìn thấy bằng chứng trước khi hành động.",
    evidence: ["Trạng thái thiết bị", "Cảnh báo vận hành", "Lịch sử sự kiện"],
  },
  {
    icon: Boxes,
    title: "Điều phối bán hàng đến sản xuất",
    description: "Danh mục, menu, đơn hàng, thanh toán và cấu hình sản xuất được liên kết theo chuỗi.",
    evidence: ["Danh mục và menu", "Đơn hàng và thanh toán", "Cấu hình sản xuất"],
  },
  {
    icon: ShieldCheck,
    title: "Quản trị có kiểm soát",
    description: "Vai trò, readiness, bảo trì và các thao tác ảnh hưởng cao luôn có ngữ cảnh vận hành.",
    evidence: ["RBAC theo phạm vi", "Readiness và bảo trì", "Theo dõi thay đổi"],
  },
];

export function ValueSection() {
  return (
    <section id="giai-phap" className="scroll-mt-20 bg-[#0B1018] py-20 text-white sm:py-24 lg:py-32" data-landing-reveal>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Nền tảng phía sau workflow</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            Không chỉ điều khiển robot.<br/><span className="text-slate-500">Vận hành cả mô hình bán hàng.</span>
          </h2>
          </div><p className="max-w-md text-base leading-7 text-slate-400 lg:col-span-4">Từ quyền truy cập đến đơn hàng và thực thi, mỗi lớp đều nằm trong cùng một ngữ cảnh vận hành.</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {capabilities.map(({ description, evidence, icon: Icon, title }, index) => (
            <article key={title} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 ${index < 2 ? "lg:col-span-3" : "lg:col-span-3"}`} data-reveal-item>
              <div className="absolute right-0 top-0 h-32 w-32 bg-cyan-300/5 blur-3xl"/><div className="flex size-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
              <ul className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5 text-xs text-slate-300">
                {evidence.map((item) => (
                  <li key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
