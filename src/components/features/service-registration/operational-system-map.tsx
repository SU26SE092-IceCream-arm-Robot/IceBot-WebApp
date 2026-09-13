import { Bot, Box, CreditCard, MonitorCog, RadioTower } from "lucide-react";

const nodes = [
  { icon: MonitorCog, label: "FaiRobot Studio", meta: "DESIGN WORKFLOW", position: "left-[8%] top-[14%]" },
  { icon: Box, label: "Workflow file", meta: "EXPORT", position: "right-[8%] top-[16%]" },
  { icon: CreditCard, label: "Order & payment", meta: "COMMERCE", position: "left-[8%] bottom-[14%]" },
  { icon: Bot, label: "Edge & robot", meta: "EXECUTION", position: "right-[8%] bottom-[14%]" },
] as const;

export function OperationalSystemMap() {
  return (
    <figure className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0A0E15] p-3 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-5" data-hero-motion>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.09),transparent_38%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]" />
      <div className="relative flex items-center justify-between border-b border-white/10 px-2 pb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" data-system-status />Workflow canvas</span>
        <span>IceBot / 01</span>
      </div>
      <div className="relative mt-3 h-[360px] sm:h-[430px]">
        <svg viewBox="0 0 600 430" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs><linearGradient id="flow" x1="0" x2="1"><stop stopColor="#67e8f9"/><stop offset="1" stopColor="#818cf8"/></linearGradient></defs>
          <path data-flow-path d="M145 105 C240 105 230 180 300 215 C370 250 360 105 455 105" fill="none" stroke="url(#flow)" strokeWidth="2" strokeDasharray="7 9" opacity=".75"/>
          <path data-flow-path d="M145 325 C240 325 230 250 300 215 C370 180 360 325 455 325" fill="none" stroke="url(#flow)" strokeWidth="2" strokeDasharray="7 9" opacity=".75"/>
          <circle cx="300" cy="215" r="64" fill="#0f172a" stroke="#67e8f9" strokeOpacity=".45"/>
          <circle cx="300" cy="215" r="78" fill="none" stroke="#67e8f9" strokeOpacity=".12"/>
        </svg>
        <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-300/25 bg-slate-950/90 text-center shadow-[0_0_55px_rgba(34,211,238,0.14)]" data-core-node>
          <RadioTower className="size-6 text-cyan-300" aria-hidden="true"/><strong className="mt-2 text-sm text-white">IceBot Core</strong><span className="mt-1 text-[9px] tracking-[0.15em] text-slate-500">ORCHESTRATION</span>
        </div>
        {nodes.map(({ icon: Icon, label, meta, position }) => (
          <div key={label} className={`absolute ${position} w-36 rounded-xl border border-white/10 bg-white/[0.055] p-3 backdrop-blur-md sm:w-40`} data-flow-node>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200"><Icon className="size-4" aria-hidden="true"/></div>
            <p className="mt-3 text-xs font-semibold text-white sm:text-sm">{label}</p><p className="mt-1 text-[9px] tracking-[0.14em] text-slate-500">{meta}</p>
          </div>
        ))}
      </div>
      <figcaption className="relative border-t border-white/10 px-2 pt-4 text-xs leading-5 text-slate-500">Một workflow đi từ mô phỏng đến thực thi — không phải số liệu vận hành trực tiếp.</figcaption>
    </figure>
  );
}
