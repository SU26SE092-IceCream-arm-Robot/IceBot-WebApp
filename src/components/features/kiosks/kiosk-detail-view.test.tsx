import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { KioskDetailView } from "@/components/features/kiosks/kiosk-detail-view";
import type { UseKioskDetailResult } from "@/hooks/use-kiosk-detail";
import type { EffectiveAccessResult } from "@/types/accounts";
import type { KioskManagementDetail } from "@/types/kiosk-detail";

const mocks = vi.hoisted(() => ({
  detail: null as UseKioskDetailResult | null,
  access: {
    accountId: "account-1",
    isSystemAdmin: true,
    roles: ["SystemAdmin"],
    permissionCodes: ["devices.manage", "program.read", "release.read", "package.read"],
    roleScopes: [],
    effectiveScope: { organizationIds: [], storeIds: [], kioskIds: [] },
  } as EffectiveAccessResult,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    effectiveAccess: mocks.access,
  }),
}));

vi.mock("@/hooks/use-kiosk-detail", () => ({
  useKioskDetail: () => mocks.detail,
}));

vi.mock("@/components/features/kiosks/devices-table", () => ({
  DevicesTable: ({ canManage }: { canManage: boolean }) => (
    <div data-testid="devices" data-can-manage={String(canManage)}>
      Danh sách thiết bị thử nghiệm
    </div>
  ),
}));

vi.mock("@/components/features/kiosks/execution-endpoints-table", () => ({
  ExecutionEndpointsTable: () => <div>Điểm thực thi thử nghiệm</div>,
}));

vi.mock("@/components/features/kiosks/operation-logs-panel", () => ({
  OperationLogsPanel: () => <div>Nhật ký vận hành thử nghiệm</div>,
}));

vi.mock("@/components/features/kiosks/production-operations-panel", () => ({
  ProductionOperationsPanel: () => <div>Cấu hình sản xuất thử nghiệm</div>,
}));

const kiosk = {
  managementId: "kiosk-1",
  kioskId: "ICEBOT_DEMO_KIOSK",
  name: "IceBot Demo Kiosk",
  organizationId: "org-1",
  locationId: "store-1",
  locationName: "IceBot Demo Store",
  lifecycleStatus: "Provisioning",
  operationalState: "Operational",
  createdAt: "2026-07-29T00:00:00Z",
  kioskType: "RoboticVending",
  timeZone: "Asia/Ho_Chi_Minh",
  configurationVersion: 1,
  settingsSchemaVersion: 1,
} satisfies KioskManagementDetail;

function readyDetail(): UseKioskDetailResult {
  return {
    kiosk,
    state: "READY",
    errorMessage: null,
    metadataWarning: null,
    heartbeats: { data: [], pagination: null, isLoading: false, errorMessage: null },
    events: { data: [], pagination: null, isLoading: false, errorMessage: null },
    isOperationalStateSubmitting: false,
    operationalStateErrorMessage: null,
    setOperationalState: vi.fn(),
    clearOperationalStateError: vi.fn(),
    refresh: vi.fn(),
  };
}

describe("KioskDetailView tab persistence", () => {
  beforeEach(() => {
    mocks.detail = readyDetail();
    mocks.access = {
      accountId: "account-1",
      isSystemAdmin: true,
      roles: ["SystemAdmin"],
      permissionCodes: ["devices.manage", "program.read", "release.read", "package.read"],
      roleScopes: [],
      effectiveScope: { organizationIds: [], storeIds: [], kioskIds: [] },
    };
  });

  it("keeps the advanced operations tab after focus revalidation reloads detail", () => {
    const { rerender } = render(<KioskDetailView kioskId="kiosk-1" />);

    fireEvent.click(screen.getByRole("tab", { name: "Vận hành kỹ thuật" }));
    expect(screen.getByRole("tab", { name: "Vận hành kỹ thuật" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Cấu hình sản xuất thử nghiệm")).toBeInTheDocument();

    mocks.detail = { ...readyDetail(), kiosk: null, state: "LOADING" };
    rerender(<KioskDetailView kioskId="kiosk-1" />);

    mocks.detail = readyDetail();
    rerender(<KioskDetailView kioskId="kiosk-1" />);

    expect(screen.getByRole("tab", { name: "Vận hành kỹ thuật" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Cấu hình sản xuất thử nghiệm")).toBeInTheDocument();
  });

  it("does not expose device management from a Manager assignment outside the kiosk scope", () => {
    mocks.access = {
      accountId: "manager-1",
      isSystemAdmin: false,
      roles: ["Manager"],
      permissionCodes: ["devices.manage", "program.read", "release.read", "package.read"],
      roleScopes: [
        {
          roleCode: "Manager",
          organizationId: "org-2",
          storeId: null,
          kioskId: null,
        },
      ],
      effectiveScope: {
        organizationIds: ["org-2"],
        storeIds: [],
        kioskIds: [],
      },
    };

    render(<KioskDetailView kioskId="kiosk-1" />);
    fireEvent.click(screen.getByRole("tab", { name: "Vận hành kỹ thuật" }));

    expect(screen.getByTestId("devices")).toHaveAttribute(
      "data-can-manage",
      "false",
    );
  });
});
