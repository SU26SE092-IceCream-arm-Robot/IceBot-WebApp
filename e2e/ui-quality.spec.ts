import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`Dashboard đọc được ở giao diện ${theme}`, async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("system-admin"));
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem("icebot-admin-theme", selectedTheme);
    }, theme);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(
      page.getByRole("heading", { name: /Kiểm soát nền tảng|Tổng quan vận hành/i }),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
