"use client";

import { PaymentMethodsView } from "@/components/features/settings/payment-methods-view";
import { useAuth } from "@/hooks/identity/use-auth";
import { hasEffectivePermission } from "@/lib/rbac";

export default function PaymentMethodsPage() {
  const { currentUser, effectiveAccess } = useAuth();

  if (!currentUser) {
    return null; // Layout handles auth loading/redirect
  }

  return (
    <PaymentMethodsView
      canManageStatus={hasEffectivePermission(
        effectiveAccess,
        "payment-methods.manage",
      )}
    />
  );
}
