import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  KioskOperationalStateDialog,
  StoreSalesAdmissionDialog,
} from "@/components/features/operations/sales-admission-dialogs";

describe("sales admission safety copy", () => {
  it("states that pausing new sales does not cancel active fulfillment", () => {
    render(
      <StoreSalesAdmissionDialog
        storeName="Cửa hàng Demo"
        isPaused={false}
        open
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Thao tác này không hủy đơn đã thanh toán hoặc công việc đang được xử lý.",
      ),
    ).toBeInTheDocument();
  });

  it("describes EmergencyStopRequested as a Cloud request, not physical proof", () => {
    render(
      <KioskOperationalStateDialog
        kioskName="Kiosk Demo"
        currentState="EmergencyStopRequested"
        open
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Đây chỉ là yêu cầu dừng khẩn cấp trên Cloud, không phải bằng chứng thiết bị hoặc robot đã dừng vật lý.",
      ),
    ).toBeInTheDocument();
  });
});
