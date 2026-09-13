import { expect, test } from "@playwright/test";

const publicDocsRoutes = [
  "/docs",
  "/docs/getting-started",
  "/docs/architecture",
  "/docs/operations",
  "/docs/api-integration",
  "/docs/realtime",
] as const;

test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  await page.addInitScript(() => window.localStorage.clear());
});

test("mọi route tài liệu đều public và có nội dung", async ({ page }) => {
  for (const route of publicDocsRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("layout tài liệu responsive và không tràn ngang", async ({ page }, testInfo) => {
  await page.goto("/docs", { waitUntil: "networkidle" });

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const viewportWidth = page.viewportSize()?.width ?? 1440;
  if (viewportWidth < 1024) {
    await page.getByRole("button", { name: "Mở menu tài liệu" }).click();
    const mobileMenu = page.locator('[role="dialog"][aria-label="Menu tài liệu"]');
    await expect(mobileMenu).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Bắt đầu nhanh", exact: true }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole("navigation", { name: "Chuyên mục tài liệu" })).toBeVisible();
  }

  await page.screenshot({
    path: testInfo.outputPath(`docs-${viewportWidth}.png`),
    fullPage: false,
  });
});

test("chat bubble hoạt động ở chế độ demo", async ({ page }, testInfo) => {
  await page.goto("/docs/api-integration", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mở trợ lý tài liệu" }).click();
  await expect(
    page.locator('[role="dialog"][aria-label="Trợ lý tài liệu IceBot"]'),
  ).toBeVisible();

  await page.getByLabel("Câu hỏi cho trợ lý tài liệu").fill("Làm sao kết nối API?");
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();

  await expect(page.getByText("Làm sao kết nối API?")).toBeVisible();
  await expect(page.getByText(/phản hồi demo cục bộ/i)).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath(`docs-chat-${page.viewportSize()?.width ?? 1440}.png`),
    fullPage: false,
  });
});
