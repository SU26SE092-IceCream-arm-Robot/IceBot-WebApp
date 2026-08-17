import React from 'react';
import { Button } from '@/components/ui/button';
import { Server, Store, Cpu, Cloud, Activity } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Content */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-primary bg-primary/10 mb-6">
            ICEBOT AUTOMATED RETAIL PLATFORM
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Vận hành điểm bán kem tự động thông minh cùng <span className="text-primary">IceBot</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            IceBot kết hợp Kiosk, nền tảng quản trị tập trung, IoT và robot để hỗ trợ vận hành hệ thống bán kem tự động tại nhiều địa điểm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#dang-ky">
              <Button size="lg" className="w-full sm:w-auto text-base">
                Đăng ký triển khai
              </Button>
            </a>
            <a href="#giai-phap">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                Khám phá hệ thống
              </Button>
            </a>
          </div>
        </div>

        {/* Visual Product Representation */}
        <div className="relative h-[400px] md:h-[500px] w-full hidden sm:block">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Central Node */}
            <div className="relative z-20 bg-card border border-border shadow-2xl rounded-2xl p-6 w-64 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <Cloud className="text-primary w-12 h-12 mb-3" />
              <h3 className="font-semibold text-lg">Cloud Managed</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center">Nền tảng quản trị tập trung</p>
              
              <div className="mt-4 pt-4 border-t w-full flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trạng thái</span>
                <span className="flex items-center text-success font-medium">
                  <Activity className="w-4 h-4 mr-1" />
                  Real-time
                </span>
              </div>
            </div>

            {/* Connecting Lines (CSS representation) */}
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/30 -z-10 animate-[spin_30s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 w-[450px] h-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20 -z-10 animate-[spin_40s_linear_infinite_reverse]" />

            {/* Orbiting Nodes */}
            <div className="absolute top-[15%] left-[20%] z-10 bg-card/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg flex items-center gap-3 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in duration-700 delay-100">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Store className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Multi-location</p>
                <p className="text-xs text-muted-foreground">Store / Kiosk</p>
              </div>
            </div>

            <div className="absolute bottom-[20%] right-[15%] z-10 bg-card/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg flex items-center gap-3 transform translate-x-1/2 translate-y-1/2 animate-in fade-in duration-700 delay-300">
              <div className="bg-secondary/20 p-2 rounded-lg">
                <Cpu className="text-secondary-foreground w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Automated</p>
                <p className="text-xs text-muted-foreground">Robot Operation</p>
              </div>
            </div>

            <div className="absolute top-[25%] right-[10%] z-10 bg-card/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg flex items-center gap-3 transform translate-x-1/2 -translate-y-1/2 animate-in fade-in duration-700 delay-500">
              <div className="bg-muted p-2 rounded-lg">
                <Server className="text-foreground w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Local Edge</p>
                <p className="text-xs text-muted-foreground">Execution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
