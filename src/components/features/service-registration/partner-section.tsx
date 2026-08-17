import React from 'react';
import { Building2, Store, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PartnerSection() {
  const partners = [
    {
      title: 'Doanh nghiệp muốn mở rộng điểm bán',
      description: 'Phù hợp với mô hình cần quản lý nhiều điểm bán trên một nền tảng tập trung.',
      icon: <Building2 className="w-8 h-8 text-primary" />,
    },
    {
      title: 'Đối tác vận hành địa điểm',
      description: 'Triển khai kiosk tại các địa điểm phù hợp và theo dõi hoạt động trong phạm vi được phân quyền.',
      icon: <Store className="w-8 h-8 text-primary" />,
    },
    {
      title: 'Đơn vị muốn ứng dụng retail automation',
      description: 'Kết hợp kiosk self-service, cloud management, IoT và robotic automation trong cùng hệ thống.',
      icon: <Bot className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <section id="doi-tac" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            IceBot phù hợp với ai?
          </h2>
          <p className="text-muted-foreground text-lg">
            Nền tảng của chúng tôi được thiết kế linh hoạt để đáp ứng nhiều mô hình hợp tác và triển khai khác nhau.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <Card key={index} className="border-border hover:-translate-y-1 transition-transform duration-300">
              <CardHeader>
                <div className="bg-background rounded-full w-14 h-14 flex items-center justify-center shadow-sm mb-4 border border-border/50">
                  {partner.icon}
                </div>
                <CardTitle className="text-xl">{partner.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {partner.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
