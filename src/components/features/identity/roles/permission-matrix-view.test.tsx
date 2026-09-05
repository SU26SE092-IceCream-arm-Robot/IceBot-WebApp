import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PermissionMatrixView } from "@/components/features/identity/roles/permission-matrix-view";

const matrix = [
  {
    policy: "accounts.manage",
    description: "Manage accounts",
    roles: ["SystemAdmin", "OrgAdmin"],
    scopeRequired: true,
  },
  {
    policy: "alerts.view",
    description: "View alerts",
    roles: ["Manager"],
    scopeRequired: false,
  },
];

describe("PermissionMatrixView", () => {
  it("shows translated permissions while preserving role and policy codes", () => {
    render(<PermissionMatrixView matrix={matrix} />);

    expect(screen.getByText("Quản lý tài khoản")).toBeInTheDocument();
    expect(screen.getByText("accounts.manage")).toBeInTheDocument();
    expect(screen.getByText("SystemAdmin")).toBeInTheDocument();
    expect(
      screen.getByText("Áp dụng theo phạm vi được phân công"),
    ).toBeInTheDocument();
  });

  it("filters by role code and translated permission text", () => {
    render(<PermissionMatrixView matrix={matrix} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Manager" },
    });

    expect(screen.getByText("Xem cảnh báo")).toBeInTheDocument();
    expect(screen.queryByText("Quản lý tài khoản")).not.toBeInTheDocument();
  });
});
