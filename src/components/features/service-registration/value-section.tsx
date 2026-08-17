import React from 'react';
import { Map, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ValueSection() {
  const values = [
    {
      title: 'Quản lý đa địa điểm',
      description: 'Quản lý Organization, Store và Kiosk tập trung trên một hệ thống.',
      icon: <Map className="w-10 h-10 text-primary" />,
    },
    {
      title: 'Vận hành theo thời gian thực',
      description: 'Theo dõi trạng thái kiosk, tồn kho, cảnh báo và các hoạt động vận hành.',
      icon: <Activity className="w-10 h-10 text-primary" />,
    },
    {
      title: 'Tự động hóa bằng robot',
      description: 'Production workflow được chuẩn bị tập trung và thực thi tại Local Edge kết nối với robot.',
      icon: <Cpu className="w-10 h-10 text-primary" />,
    },
    {
      title: 'Phân quyền theo phạm vi',
      description: 'Các vai trò quản trị, quản lý, nhân viên và kỹ thuật viên chỉ truy cập chức năng và tài nguyên phù hợp.',
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
    },
  ];

  return (
    <section id="giai-phap" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Một nền tảng cho toàn bộ hệ thống vận hành
          </h2>
          <p className="text-muted-foreground text-lg">
            Khám phá sức mạnh của hệ thống quản trị tự động tập trung, giúp bạn mở rộng quy mô kinh doanh một cách bền vững.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="border-border hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="bg-primary/5 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <CardTitle className="text-xl">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
