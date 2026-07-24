"use client";

import { PaymentMethodsView } from "@/components/features/settings/payment-methods-view";
import { useAuth } from "@/hooks/use-auth";
import { hasEffectivePermission } from "@/lib/rbac";

export default function PaymentMethodsPage() {
  const { currentUser, effectiveAccess } = useAuth();

  if (!currentUser) {
    return null; // Layout handles auth loading/redirect
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cấu hình hệ thống</h2>
      </div>
      <PaymentMethodsView
        canManageStatus={hasEffectivePermission(
          effectiveAccess,
          "payment-methods.manage",
        )}
      />
    </div>
  );
}
