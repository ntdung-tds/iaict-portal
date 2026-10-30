import { expect, test, type Page } from "@playwright/test";
import { CMS_ROLE_DEFINITIONS } from "../lib/cms-roles";

// Browser tests exercise the real user-management UI and its request payloads
// with mocked authentication/API responses. No live staging D1 writes.
const actor = { id: "qa-admin", email: "qa-admin@example.test", displayName: "Admin", roles: ["admin"] };
const initialUsers = [
  { id: "qa-admin", email: actor.email, display_name: "Admin",
    access_subject: null, is_active: 1, roles: ["admin"], created_at: "2026-10-29", updated_at: "2026-10-29" },
  { id: "qa-user", email: "qa-user@example.test", display_name: "Tài khoản thử nghiệm",
    access_subject: null, is_active: 1, hasNativePassword: true, roles: ["editor"], created_at: "2026-10-29", updated_at: "2026-10-29" },
];

type ApiHarness = {
  posts: Array<Record<string, unknown>>;
  failSave: (flag: boolean) => void;
  denyRead: (flag: boolean) => void;
};

async function mockUserManagement(page: Page): Promise<ApiHarness> {
  const posts: Array<Record<string, unknown>> = [];
  const users = structuredClone(initialUsers);
  let failNextSave = false;
  let denyReads = false;

  await page.route("**/api/admin/cms/session", async route =>
    route.fulfill({ json: { ok: true, actor } }));

  await page.route("**/api/admin/cms/users", async route => {
    const req = route.request();
    if (req.method() === "GET") {
      if (denyReads) {
        await route.fulfill({ status: 403, json: { error: "Không được phép xem người dùng." } });
      } else {
        await route.fulfill({ json: { ok: true, actor, users, roles: CMS_ROLE_DEFINITIONS } });
      }
      return;
    }
    if (req.method() === "POST") {
      const data = req.postDataJSON() as Record<string, unknown>;
      posts.push(data);
      if (failNextSave) {
        await route.fulfill({ status: 500, json: { error: "Lưu thất bại, quyền được giữ nguyên." } });
        return;
      }
      if (data.action === "revokeSessions") {
        await route.fulfill({ json: { ok: true, revoked: true } });
        return;
      }
      const user = users.find(u => u.id === data.id);
      if (user) {
        user.display_name = String(data.displayName ?? "");
        user.roles = data.roles as string[];
      }
      await route.fulfill({ json: { ok: true, id: data.id } });
      return;
    }
    await route.fulfill({ status: 405, json: { error: "Method not allowed" } });
  });

  await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Quản lý người dùng", exact: true })).toBeVisible();
  return {
    posts,
    failSave(flag: boolean) { failNextSave = flag; },
    denyRead(flag: boolean) { denyReads = flag; },
  };
}

test("administrator can edit a user and the UI sends correct role metadata", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const api = await mockUserManagement(page);
  await page.getByRole("button", { name: /Tài khoản thử nghiệm/ }).click();
  await expect(page.getByLabel("Tên hiển thị", { exact: true })).toHaveValue("Tài khoản thử nghiệm");
  await page.getByLabel("Tên hiển thị", { exact: true }).fill("Biên tập viên mới");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByText("Đã cập nhật người dùng và vai trò.", { exact: true })).toBeVisible();
  expect(api.posts).toHaveLength(1);
  expect(api.posts[0]).toMatchObject({
    id: "qa-user",
    email: "qa-user@example.test",
    displayName: "Biên tập viên mới",
    isActive: true,
    roles: ["editor"],
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("failed role update leaves edited input intact and visible error", async ({ page }) => {
  const api = await mockUserManagement(page);
  api.failSave(true);
  await page.getByRole("button", { name: /Tài khoản thử nghiệm/ }).click();
  const name = page.getByLabel("Tên hiển thị", { exact: true });
  await name.fill("Chưa lưu được");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByText("Lưu thất bại, quyền được giữ nguyên.", { exact: true })).toBeVisible();
  await expect(name).toHaveValue("Chưa lưu được");
  expect(api.posts).toHaveLength(1);
});

test("CMS prevents self-deactivation in the rendered user editor", async ({ page }) => {
  await mockUserManagement(page);
  await expect(page.getByLabel("Email Cloudflare Access *")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Vô hiệu hóa", exact: true })).toHaveCount(0);
});

test("forbidden user listing does not render account information", async ({ page }) => {
  const api = await mockUserManagement(page);
  api.denyRead(true);
  // A fresh navigation causes the authenticated UI to reload via the forbidden API.
  await page.reload();
  await expect(page.getByText("Không được phép xem người dùng.", { exact: true })).toBeVisible();
  await expect(page.getByText("qa-user@example.test")).toHaveCount(0);
});


test("shows native password readiness and lets admin revoke user sessions", async ({ page }) => {
  const api = await mockUserManagement(page);
  await page.getByRole("button", { name: /Tài khoản thử nghiệm/ }).click();
  await expect(page.getByText("Đã thiết lập mật khẩu IAICT.", { exact: false })).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Thu hồi phiên IAICT" }).click();
  await expect(page.getByText("Đã thu hồi toàn bộ phiên đăng nhập IAICT của tài khoản.", { exact: true })).toBeVisible();
  expect(api.posts).toHaveLength(1);
  expect(api.posts[0]).toMatchObject({ action: "revokeSessions", id: "qa-user" });
});
