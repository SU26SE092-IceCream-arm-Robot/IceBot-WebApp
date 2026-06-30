import { IceCream } from "lucide-react";

import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-100/50 via-zinc-50 to-zinc-50" />

      {/* Abstract accents - positioned to show through the glass card */}
      <div className="absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-cyan-300/40 blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-blue-300/40 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-50 text-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <IceCream className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            ICEBOT Admin Console
          </h1>
          <p className="mt-2 text-sm text-zinc-600 font-medium">
            Quản trị vận hành kiosk thông minh.
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl ring-1 ring-black/5 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
