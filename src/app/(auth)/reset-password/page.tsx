import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/features/identity/auth/reset-password-form";

export default function ResetPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><Suspense><ResetPasswordForm /></Suspense></main>;
}
