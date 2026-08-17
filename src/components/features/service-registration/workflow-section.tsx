import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

export function WorkflowSection() {
  const steps = [
    {
      step: '1',
      title: 'Thiết lập điểm bán',
      flow: 'Organization → Store → Kiosk',
    },
    {
      step: '2',
      title: 'Cấu hình sản phẩm',
      flow: 'Product → Menu → Production Configuration',
    },
    {
      step: '3',
      title: 'Khách hàng đặt hàng',
      flow: 'Kiosk → Cart → Checkout → QR Payment',
    },
    {
      step: '4',
      title: 'Tự động sản xuất',
      flow: 'Cloud → Local Edge → Robot',
    },
    {
      step: '5',
      title: 'Theo dõi vận hành',
      flow: 'Dashboard → Inventory → Alerts → Reports',
    },
  ];

  return (
    <section id="cach-hoat-dong" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Cách IceBot hoạt động
          </h2>
          <p className="text-muted-foreground text-lg">
            Quy trình triển khai và vận hành được thiết kế tối ưu cho nền tảng quản trị tự động.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Step Card */}
              <div className="flex-1 w-full flex flex-col items-center p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-center mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {step.flow}
                </p>
              </div>

              {/* Arrow separator (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center py-4 lg:py-0 lg:h-32 text-muted-foreground self-center">
                  <ArrowDown className="w-6 h-6 lg:hidden" />
                  <ArrowRight className="w-6 h-6 hidden lg:block" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
