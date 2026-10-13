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
  "/du-an/tram-rung",
  "/tin-tuc",
  "/lien-he",
  "/tim-kiem",
];

const categoryRoutes = [
  ["/giai-phap-dich-vu", "Giải pháp & Dịch vụ"],
  ["/san-pham-nen-tang", "Sản phẩm & Nền tảng"],
  ["/chuyen-giao-cong-nghe", "Chuyển giao công nghệ"],
  ["/dao-tao-tap-huan", "Đào tạo & Tập huấn"],
] as const;

test("homepage exposes the current IAICT applied-technology baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("IAICT - năng lực và định hướng")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ứng dụng công nghệ");
  await expect(page.getByRole("heading", { name: /Bài toán đúng trước/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Liên hệ hợp tác" })).toBeVisible();
});

test("V6 category landings expose their primary capability entry point", async ({ page }) => {
  for (const [route, title] of categoryRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: /Khám phá năng lực/i })).toHaveAttribute("href", "#capabilities");
  }
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
