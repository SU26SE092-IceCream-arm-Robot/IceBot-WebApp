import fs from "node:fs/promises";
import path from "node:path";

import { chromium, expect, type FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const accounts = [
    {
      slug: "system-admin",
      username:
        process.env.ICEBOT_E2E_SYSTEM_ADMIN_USERNAME ??
        process.env.ICEBOT_E2E_USERNAME,
      password:
        process.env.ICEBOT_E2E_SYSTEM_ADMIN_PASSWORD ??
        process.env.ICEBOT_E2E_PASSWORD,
      required: true,
    },
    {
      slug: "org-admin",
      username: process.env.ICEBOT_E2E_ORG_ADMIN_USERNAME,
      password: process.env.ICEBOT_E2E_ORG_ADMIN_PASSWORD,
      required: false,
    },
    {
      slug: "manager",
      username: process.env.ICEBOT_E2E_MANAGER_USERNAME,
      password: process.env.ICEBOT_E2E_MANAGER_PASSWORD,
      required: false,
    },
  ];

  for (const account of accounts) {
    if (account.required && (!account.username || !account.password)) {
      throw new Error(
        "Thiếu credential E2E SystemAdmin. Hãy đặt ICEBOT_E2E_SYSTEM_ADMIN_USERNAME/PASSWORD hoặc cặp ICEBOT_E2E_USERNAME/PASSWORD tương thích cũ.",
      );
    }
    if (Boolean(account.username) !== Boolean(account.password)) {
      throw new Error(
        `Credential E2E ${account.slug} chưa đủ username/password.`,
      );
    }
  }

  const baseURL = config.projects[0]?.use.baseURL;
  if (typeof baseURL !== "string") {
    throw new Error("Không xác định được ICEBOT_E2E_BASE_URL.");
  }

  const browser = await chromium.launch();
  try {
    for (const account of accounts.filter(
      (candidate) => candidate.username && candidate.password,
    )) {
      const authFile = path.resolve(`.playwright/.auth/${account.slug}.json`);
      await fs.mkdir(path.dirname(authFile), { recursive: true });
      const page = await browser.newPage();
      try {
        await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
        await page
          .getByLabel("Email hoặc tên đăng nhập")
          .fill(account.username!);
        await page.getByLabel("Mật khẩu").fill(account.password!);
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
          `Không thể tạo phiên E2E ${account.slug}. ${visibleError.filter(Boolean).join(" ") || "Kiểm tra backend, proxy và tài khoản test."}`,
          { cause: error },
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
