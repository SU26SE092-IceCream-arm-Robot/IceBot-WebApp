import React from 'react';
import { Cloud, MonitorSmartphone, Monitor, Cpu, Bot, CreditCard } from 'lucide-react';

export function EcosystemSection() {
  const nodes = [
    { label: 'Admin Web', icon: <Monitor className="w-6 h-6 text-primary" />, position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { label: 'Customer Kiosk', icon: <MonitorSmartphone className="w-6 h-6 text-primary" />, position: 'top-1/4 right-0 translate-x-1/2' },
    { label: 'PayOS', icon: <CreditCard className="w-6 h-6 text-primary" />, position: 'bottom-1/4 right-0 translate-x-1/2' },
    { label: 'Fairino Robot', icon: <Bot className="w-6 h-6 text-primary" />, position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { label: 'Local Edge', icon: <Cpu className="w-6 h-6 text-primary" />, position: 'bottom-1/4 left-0 -translate-x-1/2' },
    { label: 'Cloud Backend', icon: <Cloud className="w-6 h-6 text-primary" />, position: 'top-1/4 left-0 -translate-x-1/2' },
  ];

  return (
    <section id="he-thong" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Hệ sinh thái IceBot
          </h2>
          <p className="text-muted-foreground text-lg">
            Một kiến trúc toàn diện kết nối phần mềm quản trị, thiết bị tự phục vụ, và robot công nghiệp.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto h-[400px] md:h-[500px]">
          {/* Connecting Lines (Circle) */}
          <div className="absolute inset-8 md:inset-16 rounded-full border-2 border-dashed border-primary/20" />
          
          {/* Central Platform Node */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/20 flex flex-col items-center justify-center min-w-[200px] text-center border border-primary-foreground/20">
              <span className="text-2xl md:text-3xl font-bold tracking-tight mb-1">ICEBOT</span>
              <span className="text-sm md:text-base font-medium opacity-90">Platform</span>
            </div>
          </div>

          {/* Surrounding Nodes */}
          {nodes.map((node, index) => (
            <div
              key={index}
              className={`absolute ${node.position} z-10 bg-card border border-border shadow-md rounded-xl p-3 md:p-4 flex flex-col items-center justify-center min-w-[120px] md:min-w-[140px] text-center hover:scale-105 transition-transform duration-300`}
            >
              <div className="bg-primary/10 p-2 md:p-3 rounded-full mb-2 md:mb-3">
                {node.icon}
              </div>
              <span className="font-semibold text-sm md:text-base">{node.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
