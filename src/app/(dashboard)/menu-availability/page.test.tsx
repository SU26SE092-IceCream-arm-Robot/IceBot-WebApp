import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MenuAvailabilityPage from "@/app/(dashboard)/menu-availability/page";
import { useMenuAvailabilityWorkspace } from "@/hooks/operations/use-menu-availability-workspace";
import type { KioskResult } from "@/types/kiosks/management";

vi.mock("@/hooks/operations/use-menu-availability-workspace", () => ({
  useMenuAvailabilityWorkspace: vi.fn(),
}));

vi.mock("@/components/features/kiosks/menu-item-availability-panel", () => ({
  MenuItemAvailabilityPanel: ({ kioskName }: { kioskName?: string }) => (
    <div data-testid="availability-panel">{kioskName}</div>
  ),
}));

const kiosk = {
  id: "019fb380-5502-7b35-a6e0-dacfa5d42687",
  name: "IceBot Demo Kiosk",
  code: "ICEBOT-DEMO-KIOSK",
} as KioskResult;

function workspace(overrides: Partial<ReturnType<typeof useMenuAvailabilityWorkspace>> = {}) {
  return {
    kiosks: [kiosk],
    selectedKiosk: kiosk,
    selectedKioskId: kiosk.id,
    refreshVersion: 0,
    isLoading: false,
    errorMessage: null,
    selectKiosk: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

describe("MenuAvailabilityPage", () => {
  beforeEach(() => {
    vi.mocked(useMenuAvailabilityWorkspace).mockReturnValue(workspace());
  });

  it("shows the kiosk name and code instead of its UUID", () => {
    render(<MenuAvailabilityPage />);

    expect(screen.getByText("IceBot Demo Kiosk — ICEBOT-DEMO-KIOSK")).toBeInTheDocument();
    expect(screen.queryByText(kiosk.id)).not.toBeInTheDocument();
    expect(screen.getByTestId("availability-panel")).toHaveTextContent("IceBot Demo Kiosk");
  });

  it("shows an instruction state when the account has no kiosk in scope", () => {
    vi.mocked(useMenuAvailabilityWorkspace).mockReturnValue(workspace({
      kiosks: [],
      selectedKiosk: null,
      selectedKioskId: "",
    }));

    render(<MenuAvailabilityPage />);

    expect(screen.getByText("Chưa có kiosk nào trong phạm vi được cấp quyền.")).toBeInTheDocument();
    expect(screen.queryByTestId("availability-panel")).not.toBeInTheDocument();
  });
});
