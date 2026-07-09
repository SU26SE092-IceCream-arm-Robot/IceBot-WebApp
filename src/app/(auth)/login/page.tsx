import { IceCream } from "lucide-react";

import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/45 via-background to-background" />

      {/* Abstract accents - positioned to show through the glass card */}
      <div className="absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/40 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_color-mix(in_oklab,var(--primary)_20%,transparent)] backdrop-blur-md">
            <IceCream className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            ICEBOT Admin Console
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Quản trị vận hành kiosk thông minh.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl ring-1 ring-foreground/5 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
