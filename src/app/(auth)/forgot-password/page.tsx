import { ForgotPasswordForm } from "@/components/features/identity/auth/forgot-password-form";
import { AuthPageShell } from "@/components/features/identity/auth/auth-page-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      eyebrow="Khôi phục truy cập"
      title="Đặt lại mật khẩu"
      description="Gửi yêu cầu để nhận hướng dẫn thiết lập mật khẩu mới cho tài khoản của bạn."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
