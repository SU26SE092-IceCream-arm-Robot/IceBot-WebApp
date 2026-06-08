import { Suspense } from "react";
import { IceCream } from "lucide-react";

import { AcceptInvitationForm } from "@/components/features/auth/accept-invitation-form";

function AcceptInvitationLoading() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="size-11 animate-pulse rounded-xl bg-muted" />
      <div className="h-7 w-56 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
      <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
      <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-border" />
      <div className="absolute -top-36 left-1/2 size-96 -translate-x-1/2 rounded-full bg-secondary/50 blur-3xl" />

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_28rem]">
        <section className="hidden space-y-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <IceCream className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-foreground">IceBot</p>
              <p className="text-xs text-muted-foreground">Account Onboarding</p>
            </div>
          </div>
          <h1 className="max-w-lg text-3xl font-bold tracking-tight text-foreground">
            Tự thiết lập mật khẩu, không cần nhận mật khẩu tạm từ quản trị viên.
          </h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Liên kết chỉ dùng một lần. Sau khi kích hoạt, bạn đăng nhập bằng tài khoản vừa được cấp.
          </p>
        </section>

        <Suspense fallback={<AcceptInvitationLoading />}>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </main>
  );
}
