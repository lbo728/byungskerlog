import { test, expect } from "@playwright/test";

test.describe("Giscus Comments", () => {
  test("포스트 페이지에 Giscus 위젯이 표시됨", async ({ page }) => {
    // 한글 포스트 또는 임의의 published 포스트 URL
    await page.goto("/posts/next-js-route-handlers");

    // Giscus iframe 로드 대기 (최대 15초)
    const giscusFrame = page.locator(".giscus-frame");
    await expect(giscusFrame).toBeVisible({ timeout: 15000 });
  });
});
