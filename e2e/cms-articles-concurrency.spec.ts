import { expect, test } from "@playwright/test";

const article = {
  id: "article-qa-1", title: "Bài viết kiểm thử", slug: "bai-viet-kiem-thu",
  category_id: "category-1", category_name: "Hoạt động", status: "draft",
  body: "Nội dung kiểm thử", excerpt: "Tóm tắt", tags_json: "[]",
  hero_media_id: null, seo_json: "{}", featured: 0,
  published_at: null, updated_at: "2026-10-30T00:00:00.000Z",
};
const category = { id: "category-1", name: "Hoạt động", slug: "hoat-dong", sort_order: 0 };
const conflict = {
  code: "CONFLICT",
  error: "Nội dung đã được người khác cập nhật sau khi bạn mở trang. Bản nháp của bạn vẫn được giữ; hãy tải lại dữ liệu để so sánh trước khi lưu.",
};

async function mockStudio(page: import("@playwright/test").Page, onMutation: (request: Record<string, unknown>) => void) {
  await page.route("**/api/admin/cms/session", route =>
    route.fulfill({ json: { actor: { id: "admin-1", roles: ["admin"] } } }));
  await page.route("**/api/admin/cms/articles**", route => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: {
        actor: { id: "admin-1", roles: ["admin"] },
        articles: [article], categories: [category], media: [],
      } });
    }
    onMutation(route.request().postDataJSON());
    return route.fulfill({ status: 409, json: conflict });
  });
}

test("article studio submits original version and preserves unsaved text after 409", async ({ page }) => {
  const captured: Array<Record<string, unknown>> = [];
  await mockStudio(page, body => captured.push(body));
  await page.goto("/admin/articles");
  const title = page.getByRole("textbox", { name: "Tiêu đề *" });
  await expect(title).toHaveValue(article.title);
  await title.fill("Bài viết đang chỉnh sửa");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText(/Nội dung đã được người khác cập nhật/)).toBeVisible();
  await expect(title).toHaveValue("Bài viết đang chỉnh sửa");
  expect(captured).toHaveLength(1);
  expect(captured[0]).toMatchObject({
    action: "save-article", id: article.id, expectedUpdatedAt: article.updated_at,
  });
});

test("category editing sends unmodified original category snapshot on 409", async ({ page }) => {
  const captured: Array<Record<string, unknown>> = [];
  await mockStudio(page, body => captured.push(body));
  await page.goto("/admin/articles");
  // Wait for the initial CMS fetch; otherwise switching tabs can race app hydration.
  await expect(page.getByRole("textbox", { name: "Tiêu đề *" })).toHaveValue(article.title);
  await page.getByRole("button", { name: "Chuyên mục", exact: true }).click();
  await expect(page.getByText(category.name, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  const name = page.getByRole("textbox", { name: "Tên chuyên mục *" });
  await expect(name).toHaveValue(category.name);
  await name.fill("Chuyên mục mới đang sửa");
  await page.getByRole("button", { name: "Lưu chuyên mục" }).click();
  await expect(page.getByText(/Nội dung đã được người khác cập nhật/)).toBeVisible();
  await expect(name).toHaveValue("Chuyên mục mới đang sửa");
  expect(captured).toHaveLength(1);
  expect(captured[0]).toMatchObject({
    action: "save-category", id: category.id,
    expectedCategory: category,
  });
});
