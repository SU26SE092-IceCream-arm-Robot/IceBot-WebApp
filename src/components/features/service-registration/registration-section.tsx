import React from 'react';
import { RegistrationForm } from './registration-form';

export function RegistrationSection() {
  return (
    <section id="dang-ky" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Đăng ký triển khai IceBot
          </h2>
          <p className="text-muted-foreground text-lg">
            Hãy để lại thông tin nhu cầu triển khai. Đội ngũ IceBot sẽ sử dụng thông tin này để trao đổi về mô hình phù hợp.
          </p>
        </div>

        <RegistrationForm />
      </div>
    </section>
  );
}
