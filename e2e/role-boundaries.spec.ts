import { expect, test } from "@playwright/test";

const ROLE_BOUNDARIES = {
  "org-admin": {
    visible: [
      "Tổng quan",
      "Kiểm tra thiết lập",
      "Cấu hình sản xuất",
      "Cảnh báo",
      "Quản lý Kiosk",
      "Tồn kho",
      "Bảo trì",
      "Giao dịch",
      "Thực đơn",
      "Báo cáo",
      "Tổ chức & cửa hàng",
      "Tài khoản",
    ],
    hidden: ["Cấu hình thanh toán", "Sự cố đồng bộ"],
  },
  manager: {
    visible: [
      "Tổng quan",
      "Kiểm tra thiết lập",
      "Cấu hình sản xuất",
      "Cảnh báo",
      "Quản lý Kiosk",
      "Tồn kho",
      "Bảo trì",
      "Giao dịch",
      "Thực đơn",
      "Báo cáo",
      "Cấu hình thanh toán",
    ],
    hidden: ["Tổ chức & cửa hàng", "Tài khoản", "Sự cố đồng bộ"],
  },
} as const;

test("OrgAdmin và Manager chỉ thấy module đúng quyền", async ({ page }, testInfo) => {
  const role = testInfo.project.name.startsWith("org-admin")
    ? "org-admin"
    : testInfo.project.name.startsWith("manager")
      ? "manager"
      : null;
  test.skip(role === null);
  if (!role) return;

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const sidebar = page.locator("aside");

  for (const label of ROLE_BOUNDARIES[role].visible) {
    await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  for (const label of ROLE_BOUNDARIES[role].hidden) {
    await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  }
});
