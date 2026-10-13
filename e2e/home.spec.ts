import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/gioi-thieu",
  "/san-pham-nen-tang",
  "/giai-phap-dich-vu",
  "/chuyen-giao-cong-nghe",
  "/dao-tao-tap-huan",
  "/dao-tao-tap-huan/co-quan-nha-nuoc",
  "/du-an",
  "/tin-tuc",
  "/lien-he",
  "/tim-kiem",
];

test("homepage exposes the premium IAICT solution-first experience", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("giải pháp số");
  await expect(
    page.getByRole("heading", { name: "Bạn đang cần giải quyết bài toán nào?" }),
  ).toBeVisible();
  await expect(page.getByText("IAICT Capability System", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Trâm Rừng — từ dữ liệu hiện trường đến nền tảng quản lý số",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Dành cho cơ quan nhà nước", exact: true }),
  ).toBeVisible();
});

test("all public routes respond successfully", async ({ request }) => {
  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} should return HTTP 200`).toBe(200);
  }
});

test("health endpoint is live and no-store", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({ status: "ok" });
});
