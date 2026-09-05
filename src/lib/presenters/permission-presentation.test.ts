import { describe, expect, it } from "vitest";

import { getPermissionPresentation } from "@/lib/presenters/permission-presentation";

describe("permission presentation", () => {
  it("maps known backend policies to Vietnamese task language", () => {
    expect(getPermissionPresentation("accounts.manage")).toEqual({
      group: "Tài khoản & nhân sự",
      label: "Quản lý tài khoản",
      description:
        "Mời tài khoản, cấp vai trò, đặt lại mật khẩu hoặc vô hiệu hóa.",
    });
  });

  it("keeps an unknown policy code visible and preserves its description", () => {
    expect(
      getPermissionPresentation(
        "future-domain.execute",
        "Backend supplied description",
      ),
    ).toEqual({
      group: "Quyền khác",
      label: "future-domain.execute",
      description: "Backend supplied description",
    });
  });
});
