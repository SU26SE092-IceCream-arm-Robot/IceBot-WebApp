import { AuthPageShell } from "@/components/features/identity/auth/auth-page-shell";
import { LoginForm } from "@/components/features/identity/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      eyebrow="Truy cập tài khoản"
      title="Đăng nhập vào IceBot"
      description="Theo dõi và điều phối hoạt động trong phạm vi được tổ chức của bạn phân quyền."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
