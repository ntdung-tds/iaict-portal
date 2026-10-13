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

const institutionalRoutes = [
  ["/gioi-thieu", /Từ nghiên cứu ứng dụng đến năng lực triển khai/i],
  ["/lien-he", /Bắt đầu từ bài toán cần giải quyết/i],
  ["/tin-tuc", /Tin tức, hoạt động và góc nhìn chuyên môn/i],
] as const;

const wowV9Routes = [
  ["/du-an", /Dự án như một phòng thí nghiệm triển khai/i],
  ["/dao-tao-tap-huan/co-quan-nha-nuoc", /Đào tạo để áp dụng được vào công việc/i],
  ["/tim-kiem", /Tìm đúng năng lực, không chỉ tìm từ khóa/i],
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

test("V8 institutional landings expose their public-facing narrative", async ({ page }) => {
  for (const [route, title] of institutionalRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
  }
});

test("V9 WOW+++ remaining landings expose useful discovery paths", async ({ page }) => {
  for (const [route, title] of wowV9Routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: "IAICT - Trang chủ" })).toBeVisible();
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
