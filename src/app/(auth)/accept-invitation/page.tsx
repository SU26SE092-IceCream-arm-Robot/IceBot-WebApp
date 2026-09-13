import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/features/identity/auth/accept-invitation-form";
import { AuthPageShell } from "@/components/features/identity/auth/auth-page-shell";

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
    <AuthPageShell
      eyebrow="Kích hoạt tài khoản"
      title="Thiết lập quyền truy cập"
      description="Liên kết chỉ dùng một lần. Sau khi kích hoạt, bạn đăng nhập bằng tài khoản vừa được cấp."
    >
      <Suspense fallback={<AcceptInvitationLoading />}>
        <AcceptInvitationForm />
      </Suspense>
    </AuthPageShell>
  );
}
