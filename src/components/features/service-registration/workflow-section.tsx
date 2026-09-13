import { Boxes, Download, Play, Send, Settings2 } from "lucide-react";

const phases = [
  [Download, "01", "Thiết kế và mô phỏng", "Tải FaiRobot Studio, tạo workflow và xem trước trình tự robot sẽ thực hiện."],
  [Send, "02", "Gửi yêu cầu triển khai", "Khi mô hình đã phù hợp, gửi nhu cầu để cùng đánh giá điều kiện triển khai thực tế."],
  [Settings2, "03", "Thiết lập hệ thống", "Cấu hình tổ chức, điểm bán, nhân sự, sản phẩm, thanh toán và workflow."],
  [Boxes, "04", "Kết nối thiết bị", "Đội ngũ kỹ thuật thiết lập phần mềm máy biên và kết nối với thiết bị tại điểm bán."],
  [Play, "05", "Bắt đầu vận hành", "Đơn hàng kích hoạt workflow; đội ngũ theo dõi hoạt động trên nền tảng quản trị."],
] as const;

export function WorkflowSection() {
  return (
    <section id="cach-hoat-dong" className="scroll-mt-20 overflow-hidden bg-[#EEF1F8] py-20 sm:py-24 lg:py-32" data-landing-reveal>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end"><div className="max-w-3xl lg:col-span-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#175CD3]">Hành trình triển khai</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#101828] sm:text-5xl lg:text-6xl">Năm phase.<br/><span className="text-slate-400">Không có hộp đen.</span></h2></div><p className="text-base leading-7 text-[#475467] lg:col-span-4">Trải nghiệm trước. Chỉ bắt đầu trao đổi khi workflow đã thể hiện đúng ý tưởng của bạn.</p></div>
        <ol className="relative mt-16 grid gap-4 lg:grid-cols-5" data-workflow-rail>
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-cyan-500 via-indigo-500 to-slate-300 lg:block" aria-hidden="true"/>
          {phases.map(([Icon, number, title, description]) => <li key={number} className="relative rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_20px_45px_rgba(30,41,59,0.08)] backdrop-blur-xl" data-reveal-item><div className="relative z-10 flex items-center justify-between"><span className="flex size-14 items-center justify-center rounded-full bg-[#101828] font-mono text-xs font-bold text-white shadow-[0_0_0_6px_#EEF1F8]">{number}</span><Icon className="size-5 text-[#175CD3]" aria-hidden="true" /></div><h3 className="mt-8 text-lg font-semibold text-[#182230]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#475467]">{description}</p></li>)}
        </ol>
      </div>
    </section>
  );
}
