import { expect, test } from "@playwright/test";

test("homepage exposes the IAICT baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("giải pháp số");
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
});

test("health endpoint is live and no-store", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({ status: "ok" });
});
