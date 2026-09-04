import React from "react";

import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";

import { RegistrationForm } from "./registration-form";

export function RegistrationSection() {
  return (
    <section id="dang-ky" className="scroll-mt-20 bg-[#182230] py-16 sm:py-20 lg:py-28" data-landing-reveal>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold text-[#5DD6EA]">Bắt đầu trao đổi</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
            Gửi nhu cầu để bắt đầu một cuộc trao đổi có thể theo dõi.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Biểu mẫu thu thập thông tin cần thiết để xác định bối cảnh triển khai. Sau khi gửi, bạn nhận được mã tham chiếu để lưu lại yêu cầu.
          </p>
          <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-200">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#5DD6EA]" aria-hidden="true" />Thông tin được gửi theo một request có mã nhận diện.</li>
            <li className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-[#5DD6EA]" aria-hidden="true" />Các trường bổ sung chỉ dùng để làm rõ nhu cầu của bạn.</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#5DD6EA]" aria-hidden="true" />Điều khoản và chính sách được liên kết trực tiếp trước khi đồng ý.</li>
          </ul>
        </div>
        <div className="lg:col-span-7"><RegistrationForm /></div>
      </div>
    </section>
  );
}
