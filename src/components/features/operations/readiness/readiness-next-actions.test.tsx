import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadinessNextActions } from "@/components/features/operations/readiness/readiness-next-actions";
import type { ReadinessCheck } from "@/types/operations/readiness";

function menuCheck(status: ReadinessCheck["status"]): ReadinessCheck {
  return {
    id: "MENU_EXISTS",
    group: "catalog",
    title: "Có thực đơn",
    description: "Cửa hàng cần có ít nhất một thực đơn.",
    status,
    isCritical: true,
    action: { label: "Mở thực đơn", href: "/menus" },
  };
}

describe("ReadinessNextActions", () => {
  it("distinguishes missing configuration from an existing inactive menu", () => {
    const { rerender } = render(
      <ReadinessNextActions actions={[menuCheck("missing")]} />,
    );

    expect(screen.getByText("Tạo thực đơn")).toBeInTheDocument();
    expect(screen.getByText("Bắt buộc")).toBeInTheDocument();

    rerender(<ReadinessNextActions actions={[menuCheck("warning")]} />);

    expect(screen.getByText("Kích hoạt thực đơn")).toBeInTheDocument();
    expect(screen.getByText("Cần kích hoạt")).toBeInTheDocument();
  });
});
