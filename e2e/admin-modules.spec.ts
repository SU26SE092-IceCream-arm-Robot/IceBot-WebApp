import { expect, test, type Page, type TestInfo } from "@playwright/test";

interface ModuleRoute {
  name: string;
  path: string;
  heading: RegExp;
}

const MODULE_ROUTES: readonly ModuleRoute[] = [
  { name: "Tổng quan", path: "/dashboard", heading: /Kiểm soát nền tảng|Tổng quan vận hành/i },
  { name: "Kiểm tra thiết lập", path: "/readiness", heading: /Sẵn sàng vận hành|Kiểm tra thiết lập/i },
  { name: "Cấu hình sản xuất", path: "/production", heading: /Cấu hình sản xuất/i },
  { name: "Cảnh báo", path: "/alerts", heading: /Cảnh báo hệ thống/i },
  { name: "Quản lý Kiosk", path: "/kiosks", heading: /Giám sát Kiosk/i },
  { name: "Tồn kho", path: "/inventory", heading: /Tồn kho/i },
  { name: "Bảo trì", path: "/maintenance", heading: /Bảo trì/i },
  { name: "Giao dịch", path: "/transactions", heading: /Giao dịch/i },
  { name: "Thực đơn", path: "/menu", heading: /Thực đơn/i },
  { name: "Báo cáo", path: "/reports", heading: /Báo cáo vận hành/i },
  { name: "Tổ chức và cửa hàng", path: "/organizations", heading: /Tổ chức & cửa hàng/i },
  { name: "Tài khoản", path: "/users", heading: /Quản lý tài khoản/i },
  { name: "Cấu hình thanh toán", path: "/settings/payment-methods", heading: /Cấu hình hệ thống/i },
  { name: "Sự cố đồng bộ", path: "/platform/exceptions", heading: /Sự cố đồng bộ/i },
];

function collectRuntimeFailures(page: Page, testInfo: TestInfo) {
  const failures: string[] = [];

  page.on("pageerror", (error) => {
    failures.push(`PAGE_ERROR ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`CONSOLE_ERROR ${message.text()}`);
    }
  });

  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    const isManagedRequest =
      url.includes("/api/backend/") || url.includes("/api/v1/management/");

    if (isManagedRequest && (status === 401 || status === 403 || status >= 500)) {
      failures.push(`HTTP_${status} ${url}`);
    }
  });

  return async () => {
    if (failures.length > 0) {
      await testInfo.attach("runtime-failures", {
        body: failures.join("\n"),
        contentType: "text/plain",
      });
    }
    expect(failures, failures.join("\n")).toEqual([]);
  };
}

test.describe("System Admin - smoke toàn bộ module", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("system-admin"));
  });

  for (const moduleRoute of MODULE_ROUTES) {
    test(`${moduleRoute.name} tải thành công`, async ({ page }, testInfo) => {
      const assertNoRuntimeFailures = collectRuntimeFailures(page, testInfo);
      const response = await page.goto(moduleRoute.path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), `Không tải được ${moduleRoute.path}`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${moduleRoute.path.replaceAll("/", "\\/")}(?:\\?.*)?$`));
      await expect(page.locator("main").first()).toBeVisible();
      await expect(page.getByRole("heading", { name: moduleRoute.heading }).first()).toBeVisible();
      await expect(page.getByText("Không có quyền truy cập trang này")).toHaveCount(0);
      await expect(page.getByText("Chưa thể xác minh phiên đăng nhập")).toHaveCount(0);

      await assertNoRuntimeFailures();
    });
  }
});
