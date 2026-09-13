import { expect, test } from "@playwright/test";

const AUTH_ROUTES = [
  { path: "/login", heading: "Đăng nhập vào IceBot" },
  { path: "/forgot-password", heading: "Đặt lại mật khẩu" },
  { path: "/reset-password", heading: "Chọn mật khẩu mới" },
  { path: "/accept-invitation", heading: "Thiết lập quyền truy cập" },
] as const;

test.describe("Public & authentication responsive quality", () => {
  for (const route of AUTH_ROUTES) {
    test(`${route.path} giữ layout trong viewport`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    });
  }

  test("trường mật khẩu giữ giá trị khi đổi chế độ hiển thị", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    const password = page.locator('input[name="password"]');
    await password.fill("Password123");
    await expect(password).toHaveValue("Password123");
    await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Password123");
  });

  test("trang nội dung render HTML tĩnh và dùng anchor về Landing", async ({
    page,
  }) => {
    await page.route(
      "**/api/backend/v1/content-pages/privacy-policy",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            slug: "privacy-policy",
            title: "Chính sách bảo mật",
            bodyHtml: "<p>Nội dung HTML công khai.</p>",
            publishedAt: "2026-09-05T00:00:00Z",
            revisionNumber: 1,
          }),
        });
      },
    );
    await page.goto("/privacy-policy", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Nội dung HTML công khai.")).toBeVisible();
    await expect(
      page.locator('nav[aria-label="Điều hướng chính"] a[href="/#giai-phap"]'),
    ).toHaveAttribute("href", "/#giai-phap");
  });
});
