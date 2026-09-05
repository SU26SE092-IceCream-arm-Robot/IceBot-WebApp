import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.ICEBOT_E2E_BASE_URL ?? "http://localhost:3000";
const useExternalWebServer = process.env.ICEBOT_E2E_EXTERNAL_WEB === "1";
const hasOrgAdminCredentials = Boolean(
  process.env.ICEBOT_E2E_ORG_ADMIN_USERNAME &&
  process.env.ICEBOT_E2E_ORG_ADMIN_PASSWORD,
);
const hasManagerCredentials = Boolean(
  process.env.ICEBOT_E2E_MANAGER_USERNAME &&
  process.env.ICEBOT_E2E_MANAGER_PASSWORD,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global.setup.ts",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: useExternalWebServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: "public-desktop",
      testMatch: /.*(landing|public-auth).*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "public-mobile",
      testMatch: /.*(landing|public-auth).*\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "public-tablet",
      testMatch: /.*public-auth.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "public-laptop",
      testMatch: /.*public-auth.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: "system-admin-desktop",
      testIgnore: /.*(landing|public-auth).*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: ".playwright/.auth/system-admin.json",
      },
    },
    {
      name: "system-admin-tablet",
      testIgnore: /.*(landing|public-auth).*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
        storageState: ".playwright/.auth/system-admin.json",
      },
    },
    ...(hasOrgAdminCredentials
      ? [
          {
            name: "org-admin-desktop",
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 1440, height: 900 },
              storageState: ".playwright/.auth/org-admin.json",
            },
          },
        ]
      : []),
    ...(hasManagerCredentials
      ? [
          {
            name: "manager-desktop",
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 1440, height: 900 },
              storageState: ".playwright/.auth/manager.json",
            },
          },
        ]
      : []),
  ],
});
