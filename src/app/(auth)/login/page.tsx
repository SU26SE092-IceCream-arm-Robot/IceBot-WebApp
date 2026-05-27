import { IceCream } from "lucide-react";

import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-border" />
      <div className="absolute -top-36 left-1/2 size-96 -translate-x-1/2 rounded-full bg-secondary/50 blur-3xl" />

      <div className="relative grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_28rem]">
        <section className="hidden space-y-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <IceCream className="size-6" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">ICEBOT</p>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <h1 className="max-w-lg text-4xl font-bold tracking-tight text-foreground">
            Theo dõi hạm đội kiosk theo thời gian vận hành.
          </h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Quản lý trạng thái máy, cảnh báo phần cứng và dữ liệu vận hành từ một giao diện tập
            trung.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
