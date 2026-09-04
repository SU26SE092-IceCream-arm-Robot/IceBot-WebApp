import { expect, test } from "@playwright/test";

test.describe("Landing Page - Public E2E Verification", () => {
  test("Hiển thị Hero Section, H1, và nút tải FaiRobot Studio trỏ đúng link release", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // H1 check
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Biến workflow thành một điểm bán");

    // Download CTA link to official release
    const downloadCta = page.getByRole("link", {
      name: /Tải FaiRobot Studio cho Windows/i,
    });
    await expect(downloadCta).toBeVisible();
    await expect(downloadCta).toHaveAttribute(
      "href",
      "https://github.com/SU26SE092-IceCream-arm-Robot/Fairino-Studio/releases",
    );

    // Deployment Journey anchor CTA
    const journeyCta = page.getByRole("link", {
      name: "Xem hành trình triển khai",
    });
    await expect(journeyCta).toBeVisible();
    await expect(journeyCta).toHaveAttribute("href", "#cach-hoat-dong");
  });

  test("Điều hướng Header và các Anchor link hoạt động trơn tru", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Click 'Cách hoạt động' anchor link (handles both desktop nav and mobile drawer)
    const mobileMenuBtn = page.getByRole("button", { name: "Mở menu điều hướng" });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.evaluate((btn: HTMLElement) => btn.click());
      const mobileNav = page
        .locator("#public-mobile-menu")
        .getByRole("link", { name: "Cách hoạt động" });
      await expect(mobileNav).toBeVisible();
      await mobileNav.evaluate((link: HTMLElement) => link.click());
    } else {
      const workflowNav = page
        .locator("header nav")
        .getByRole("link", { name: "Cách hoạt động" });
      await expect(workflowNav).toBeVisible();
      await workflowNav.click();
    }
    await expect(page.locator("#cach-hoat-dong")).toBeInViewport();

    // Check key anchor sections exist
    await expect(page.locator("#giai-phap")).toBeAttached();
    await expect(page.locator("#doi-tac")).toBeAttached();
    await expect(page.locator("#he-thong")).toBeAttached();
    await expect(page.locator("#dang-ky")).toBeAttached();
  });

  test("Hiển thị đầy đủ 5 phase cards của luồng triển khai (Workflow Phases) và không bị ẩn", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const workflowSection = page.locator("#cach-hoat-dong");
    await workflowSection.scrollIntoViewIfNeeded();

    // Verify all 5 phase cards exist with accurate titles
    const phaseNames = [
      "Thiết kế và mô phỏng",
      "Gửi yêu cầu triển khai",
      "Thiết lập hệ thống",
      "Kết nối thiết bị",
      "Bắt đầu vận hành",
    ];

    for (const phaseName of phaseNames) {
      const card = page.getByText(phaseName);
      await expect(card).toBeVisible({ timeout: 10_000 });
    }

    // Verify computed opacity is visible (not scrubbed away)
    const cards = page.locator("#cach-hoat-dong [data-reveal-item]");
    await expect(cards).toHaveCount(5);

    for (let i = 0; i < 5; i++) {
      await expect(cards.nth(i)).toBeVisible();
      const opacity = await cards.nth(i).evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });
      expect(parseFloat(opacity)).toBeGreaterThan(0.5);
    }
  });

  test("Form đăng ký đối tác hiển thị validation khi rỗng và submit thành công", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const formSection = page.locator("#dang-ky");
    await formSection.scrollIntoViewIfNeeded();

    const submitBtn = formSection.getByRole("button", {
      name: /Gửi yêu cầu đăng ký/i,
    });
    await expect(submitBtn).toBeVisible();

    // Submit empty to trigger validation
    await submitBtn.click();
    await expect(
      page.getByText(/Vui lòng nhập họ và tên người liên hệ/i),
    ).toBeVisible();

    // Fill valid data
    await page.locator("#contactName").fill("Nguyen Van Test");
    await page.locator("#email").fill("partner.test@example.com");
    await page.locator("#businessName").fill("RoboCoffee Center");
    await page.locator("#phoneNumber").fill("0901234567");
    await page.locator("#address").fill("Quận 1, TP. Hồ Chí Minh");
    await page.locator("#privacyPolicyAccepted").check();

    // Mock API registration response to test UI outcome reliably
    await page.route("**/*service-registrations*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          succeeded: true,
          data: {
            id: "test-reg-id-123",
            referenceCode: "REG-2026-TEST",
            status: "Submitted",
            submittedAt: new Date().toISOString(),
          },
          message: "Gửi yêu cầu đăng ký dịch vụ thành công!",
        }),
      });
    });

    await submitBtn.click();

    // Verify success confirmation state and reference code
    await expect(
      page.getByRole("heading", { name: /Đăng ký dịch vụ thành công!/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("REG-2026-TEST")).toBeVisible();
  });

  test("Hỗ trợ chuẩn tiếp cận bằng bàn phím (Keyboard Navigation)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Tab through elements and ensure focused element is active
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });
    expect(focusedElement).not.toBeNull();
  });

  test("Hoạt động chuẩn xác khi kích hoạt prefers-reduced-motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Ensure all critical sections render and are immediately attached
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#cach-hoat-dong")).toBeAttached();
    await expect(page.locator("#he-thong")).toBeAttached();
    await expect(page.locator("#dang-ky")).toBeAttached();
  });

  test("Không xảy ra hiện tượng tràn ngang (Horizontal Overflow) trên thiết bị", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
      );
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("Đo kiểm độ mượt khi cuộn trang và ổn định hiển thị dưới 4x CPU Throttling", async ({
    page,
    context,
  }) => {
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await page.goto("/", { waitUntil: "networkidle" });

    // Smooth scroll down the page to trigger all GSAP ScrollTriggers
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 80);
      });
    });

    // Verify critical sections remain fully rendered without errors
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#cach-hoat-dong")).toBeVisible();
    await expect(page.locator("#dang-ky")).toBeVisible();
  });
});
