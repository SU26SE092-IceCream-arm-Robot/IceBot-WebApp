import fs from "node:fs/promises";
import path from "node:path";

import { chromium, expect, type FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const username = process.env.ICEBOT_E2E_USERNAME;
  const password = process.env.ICEBOT_E2E_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Thiếu ICEBOT_E2E_USERNAME hoặc ICEBOT_E2E_PASSWORD. Hãy đặt biến môi trường trước khi chạy browser test.",
    );
  }

  const baseURL = config.projects[0]?.use.baseURL;
  if (typeof baseURL !== "string") {
    throw new Error("Không xác định được ICEBOT_E2E_BASE_URL.");
  }

  const authFile = path.resolve(".playwright/.auth/system-admin.json");
  await fs.mkdir(path.dirname(authFile), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email hoặc tên đăng nhập").fill(username);
    await page.getByLabel("Mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await page.waitForURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
    await expect(page.getByText("Đăng nhập thành công.")).toBeVisible();
    await page.context().storageState({ path: authFile });
  } catch (error) {
    const visibleError = await page
      .locator('[class*="destructive"]')
      .allTextContents()
      .catch(() => []);
    throw new Error(
      `Không thể tạo phiên E2E. ${visibleError.filter(Boolean).join(" ") || "Kiểm tra backend, proxy và tài khoản test."}`,
      { cause: error },
    );
  } finally {
    await browser.close();
  }
}
