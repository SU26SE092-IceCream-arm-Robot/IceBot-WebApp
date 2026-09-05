import { AuthenticatedAppProviders } from "@/components/shared/authenticated-app-providers";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthenticatedAppProviders>
      <div className="auth-shell">{children}</div>
    </AuthenticatedAppProviders>
  );
}
