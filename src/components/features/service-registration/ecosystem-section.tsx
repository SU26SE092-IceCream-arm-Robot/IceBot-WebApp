import { Bot, Boxes, Cloud, Monitor, MonitorSmartphone } from "lucide-react";

const layers = [
  { icon: Monitor, label: "Simulation", eyebrow: "Design", description: "FaiRobot Studio mô phỏng và xuất workflow.", tone: "from-cyan-300/20 to-cyan-300/[0.03]" },
  { icon: MonitorSmartphone, label: "Commerce", eyebrow: "Sell", description: "Kiosk, đơn hàng và thanh toán tạo giao dịch.", tone: "from-blue-400/20 to-blue-400/[0.03]" },
  { icon: Bot, label: "Execution", eyebrow: "Make", description: "Máy biên kết nối workflow với robot tại điểm bán.", tone: "from-indigo-400/20 to-indigo-400/[0.03]" },
  { icon: Boxes, label: "Operations", eyebrow: "Operate", description: "Tồn kho, cảnh báo và bảo trì khép kín vòng vận hành.", tone: "from-violet-400/20 to-violet-400/[0.03]" },
];

export function EcosystemSection() {
  return (
    <section id="he-thong" className="scroll-mt-20 overflow-hidden bg-[#070A10] py-20 text-white sm:py-24 lg:py-32" data-landing-reveal>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl lg:col-span-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Một hệ thống, bốn lớp</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Từ ý tưởng trên canvas<br /><span className="text-slate-500">đến chuyển động ngoài đời.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-slate-400 lg:col-span-4">
            IceBot kết nối các lớp cần thiết để một workflow có thể tham gia vào hoạt động bán hàng thực tế.
          </p>
        </div>

        <div className="relative mt-16 lg:mt-20">
          <div className="absolute bottom-0 left-1/2 h-32 w-4/5 -translate-x-1/2 bg-indigo-500/20 blur-[90px]" aria-hidden="true" />
          <ol className="relative grid gap-3 lg:grid-cols-4 lg:items-end">
            {layers.map(({ description, eyebrow, icon: Icon, label, tone }, index) => (
              <li
                key={label}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${tone} p-6`}
                style={{ minHeight: `${280 + index * 28}px` }}
                data-reveal-item
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-slate-500">0{index + 1}</span>
                  <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-cyan-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{label}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative mt-3 flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-5 py-4 text-xs sm:text-sm" data-reveal-item>
            <span className="flex items-center gap-2 font-semibold text-cyan-100"><Cloud className="size-4" aria-hidden="true" />IceBot orchestration layer</span>
            <span className="hidden text-slate-500 sm:block">Cấu hình · Quan sát · Điều phối</span>
          </div>
        </div>
      </div>
    </section>
  );
}
