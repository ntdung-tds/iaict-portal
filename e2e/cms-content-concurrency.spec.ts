import { expect, test } from "@playwright/test";
import { getCmsModule } from "../lib/cms-schema";

const product = {
  id: "prod-1", title: "Nền tảng IAICT", slug: "nen-tang-iaict",
  summary: "Bản ghi thử nghiệm", status: "draft",
  features_json: "[]", technologies_json: "[]", benefits_json: "[]",
  seo_json: "{}", featured: 0,
  updated_at: "2026-10-29T15:00:00.000Z",
};

test("content editor submits the original optimistic-lock token and preserves drafts on 409", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/admin/cms/session", route =>
    route.fulfill({ json: { actor: { id: "admin-1", roles: ["admin"] } } }));
  await page.route("**/api/admin/cms/collection?*", route =>
    route.fulfill({ json: {
      actor: { roles: ["admin"] }, module: getCmsModule("products"),
      items: [product], total: 1, references: {},
    } }));
  const captured: Array<Record<string, unknown>> = [];
  await page.route("**/api/admin/cms/collection", route => {
    captured.push(route.request().postDataJSON());
    return route.fulfill({ status: 409, json: { error:
      "Nội dung đã được người khác cập nhật sau khi bạn mở trang. Bản nháp của bạn vẫn được giữ; hãy tải lại dữ liệu để so sánh trước khi lưu.",
      code: "CONFLICT",
    } });
  });
  await page.goto("/admin/content/products");
  const title = page.getByRole("textbox", { name: "Tên sản phẩm", exact: true });
  await expect(title).toHaveValue(product.title);
  await title.fill("Biên tập viên đang soạn");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByText(/Nội dung đã được người khác cập nhật/)).toBeVisible();
  await expect(title).toHaveValue("Biên tập viên đang soạn");
  expect(captured).toHaveLength(1);
  expect(captured[0]).toMatchObject({
    module: "products", id: product.id, expectedUpdatedAt: product.updated_at,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("content delete also sends the selected record version", async ({ page }) => {
  await page.route("**/api/admin/cms/session", route =>
    route.fulfill({ json: { actor: { id: "admin-1", roles: ["admin"] } } }));
  await page.route("**/api/admin/cms/collection?*", route =>
    route.fulfill({ json: { actor: { roles: ["admin"] },
      module: getCmsModule("products"), items: [product], total: 1, references: {},
    } }));
  let sent: Record<string, unknown> | null = null;
  await page.route("**/api/admin/cms/collection", route => {
    sent = route.request().postDataJSON();
    return route.fulfill({ status: 409, json: { error: "Bản ghi đã thay đổi.", code: "CONFLICT" } });
  });
  await page.goto("/admin/content/products");
  await expect(page.getByRole("textbox", { name: "Tên sản phẩm", exact: true })).toHaveValue(product.title);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /Xóa sản phẩm|Xóa mục|Xóa bản ghi|Xóa$/ }).click();
  await expect(page.getByText("Bản ghi đã thay đổi.", { exact: true })).toBeVisible();
  expect(sent).toMatchObject({ module: "products", id: product.id, expectedUpdatedAt: product.updated_at });
});
