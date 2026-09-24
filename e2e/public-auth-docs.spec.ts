import { expect, test } from "@playwright/test";

const publicDocsRoutes = [
  "/docs",
  "/docs/getting-started",
  "/docs/admin-web",
  "/docs/kiosk",
  "/docs/full-edge",
  "/docs/fairobot-studio",
  "/docs/operations",
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
      mobileMenu.getByRole("link", { name: "Bắt đầu sử dụng", exact: true }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole("navigation", { name: "Chuyên mục tài liệu" })).toBeVisible();
  }

  await page.screenshot({
    path: testInfo.outputPath(`docs-${viewportWidth}.png`),
    fullPage: false,
  });
});

test("user guides render their Report 6 screenshots with accessible descriptions", async ({ page }) => {
  await page.goto("/docs/admin-web", { waitUntil: "networkidle" });
  await expect(page.locator("figure img")).toHaveCount(7);
  await expect(page.locator("figure img").first()).toHaveAttribute("alt", /.+/);

  await page.goto("/docs/kiosk", { waitUntil: "networkidle" });
  await expect(page.locator("figure img")).toHaveCount(8);
  await expect(page.locator("figure img").last()).toHaveAttribute("alt", /.+/);
});

test("chat bubble hiển thị phản hồi sản phẩm mà không lộ thông tin kỹ thuật", async ({ page }, testInfo) => {
  await page.goto("/docs/admin-web", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mở trợ lý tài liệu" }).click();
  await expect(
    page.locator('[role="dialog"][aria-label="Trợ lý tài liệu IceBot"]'),
  ).toBeVisible();

  await page.getByLabel("Câu hỏi cho trợ lý tài liệu").fill("Làm sao kết nối API?");
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();

  await expect(page.getByText("Làm sao kết nối API?")).toBeVisible();
  const chatDialog = page.locator('[role="dialog"][aria-label="Trợ lý tài liệu IceBot"]');
  await expect(chatDialog.getByText("Đang trả lời...")).toBeHidden();
  await expect(chatDialog.locator("p").nth(1)).toBeVisible();
  await expect(page.getByText(/API_BASE_URL|Chat API|endpoint|CORS/i)).toHaveCount(0);
  await expect(page.getByText(/preview|demo|mock/i)).toHaveCount(0);

  await page.screenshot({
    path: testInfo.outputPath(`docs-chat-${page.viewportSize()?.width ?? 1440}.png`),
    fullPage: false,
  });
});
