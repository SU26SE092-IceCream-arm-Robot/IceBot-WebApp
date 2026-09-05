import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/features/identity/auth/reset-password-form";
import { AuthPageShell } from "@/components/features/identity/auth/auth-page-shell";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      eyebrow="Khôi phục truy cập"
      title="Chọn mật khẩu mới"
      description="Liên kết này giúp bạn thiết lập lại quyền truy cập vào tài khoản IceBot."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
