import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertDetailDrawer } from "@/components/features/alerts/alert-detail-drawer";
import type { AlertResult } from "@/types/alerts";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    effectiveAccess: {
      accountId: "account-1",
      isSystemAdmin: true,
      roles: ["SystemAdmin"],
      permissionCodes: ["alerts.manage"],
      roleScopes: [],
      effectiveScope: { organizationIds: [], storeIds: [], kioskIds: [] },
    },
  }),
}));

const alert: AlertResult = {
  id: "alert-1",
  organizationId: "org-1",
  storeId: "store-1",
  kioskId: "kiosk-1",
  deviceId: null,
  alertCode: "INVENTORY_LOW",
  severity: "Warning",
  title: "Nguyên liệu sắp hết",
  message: "Mức nguyên liệu thấp.",
  status: "Open",
  sourceType: "InventoryDispenserState",
  sourceId: "source-1",
  raisedAt: "2026-08-11T00:00:00Z",
  lastOccurredAt: "2026-08-11T00:05:00Z",
  occurrenceCount: 1,
  acknowledgedByAccountId: null,
  acknowledgedAt: null,
  resolvedAt: null,
  resolutionNotes: null,
  createdAt: "2026-08-11T00:00:00Z",
  updatedAt: null,
};

describe("AlertDetailDrawer", () => {
  it("shows a lifecycle mutation error inside the open dialog", () => {
    render(
      <AlertDetailDrawer
        open
        onOpenChange={vi.fn()}
        alert={alert}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
        isSubmitting={false}
        mutationErrorMessage="Không thể tiếp nhận cảnh báo."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không thể tiếp nhận cảnh báo.",
    );
  });
});
