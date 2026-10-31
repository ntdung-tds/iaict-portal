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
  await expect(page.getByLabel("Email người dùng *")).toBeDisabled();
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


test("native login checks a separate private session page instead of redirecting to Cloudflare Access", async ({ page }) => {
  let submittedLogin: {email:string;password:string} | null = null;
  await page.route("**/api/auth/login", async route => {
    if (route.request().method() === "POST") {
      const submitted = route.request().postDataJSON() as {email:string;password:string};
      submittedLogin = submitted;
      await route.fulfill({ json: { ok:true }, headers: {"Cache-Control":"no-store"} });
      return;
    }
    await route.fulfill({status:405,json:{error:"Method not allowed"}});
  });
  await page.route("**/api/auth/session", route => route.fulfill({
    json:{ok:true,actor:{email:"qa-admin@example.test",displayName:"QA Admin",roles:["admin"]}},
    headers:{"Cache-Control":"private, no-store","Vary":"Cookie"},
  }));
  await page.goto("/login");
  await page.getByLabel("Email", { exact:true }).fill("qa-admin@example.test");
  await page.getByLabel("Mật khẩu", { exact:true }).fill("S3cure!!8");
  const formValid = await page.locator("form").evaluate(node => (node as HTMLFormElement).checkValidity());
  expect(formValid, "browser-native HTML constraints must allow submitting the test account").toBe(true);
  const loginPost = page.waitForResponse(response => response.url().endsWith("/api/auth/login") && response.request().method() === "POST");
  await page.getByRole("button", { name:"Đăng nhập", exact:true }).click();
  expect((await loginPost).status()).toBe(200);
  expect(submittedLogin).toEqual({email:"qa-admin@example.test",password:"S3cure!!8"});
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("Phiên đăng nhập IAICT đã được xác minh.")).toBeVisible();
  await expect(page.getByText("qa-admin@example.test")).toBeVisible();
  await expect(page.getByText("admin", { exact:true })).toBeVisible();
  await expect(page.getByRole("link",{name:/Mở CMS/})).toHaveAttribute("href","/admin");
});

test("native session account page is usable while signed out without leaking identities", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({
    status:401,json:{error:"Phiên đăng nhập IAICT không hợp lệ hoặc đã hết hạn."},
  }));
  await page.setViewportSize({width:320,height:844});
  await page.goto("/account");
  await expect(page.getByText("Chưa đăng nhập IAICT hoặc phiên đã hết hạn.")).toBeVisible();
  await expect(page.getByRole("link",{name:"Đăng nhập IAICT"})).toHaveAttribute("href","/login");
  await expect(page.getByText("qa-admin@example.test")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("native session page sends same-origin logout and returns to login", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({
    json:{ok:true,actor:{email:"qa-admin@example.test",displayName:"QA Admin",roles:["admin"]}},
  }));
  let logoutCalls=0;
  await page.route("**/api/auth/logout", route=>{
    expect(route.request().method()).toBe("POST");
    logoutCalls++;
    return route.fulfill({json:{ok:true}});
  });
  await page.goto("/account");
  await expect(page.getByRole("button",{name:"Đăng xuất IAICT"})).toBeVisible();
  await page.getByRole("button",{name:"Đăng xuất IAICT"}).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(logoutCalls).toBe(1);
});


test("password setup identifies the authenticated CMS account email, not a different personal email", async ({ page }) => {
  await page.route("**/api/admin/cms/session", route => route.fulfill({
    json: {ok:true,actor:{id:"qa-admin",email:"qa-admin@example.test",displayName:"Admin",roles:["admin"]}},
    headers:{"Cache-Control":"no-store"},
  }));
  await page.goto("/admin/security");
  await expect(page.getByRole("heading",{name:"Bảo mật tài khoản IAICT"})).toBeVisible();
  await expect(page.getByTestId("iaict-login-email")).toHaveText("qa-admin@example.test");
  await expect(page.getByText("phải sử dụng chính xác email trên", {exact:false})).toBeVisible();
  await expect(page.getByRole("link",{name:"Mở trang đăng nhập IAICT"})).toHaveAttribute("href","/login");
  await expect(page.getByText("qa-other@example.test")).toHaveCount(0);
});

test("native account password change revokes sessions after a verified request", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  const sent: Array<Record<string, unknown>> = [];
  await page.route("**/api/account/password", async route => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    sent.push(request.postDataJSON() as Record<string, unknown>);
    await route.fulfill({json:{ok:true,reauthenticationRequired:true}});
  });
  await page.goto("/account/security", {waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"Đổi mật khẩu IAICT"})).toBeVisible();
  await page.getByLabel("Mật khẩu IAICT hiện tại").fill("Old-pass-2026");
  await page.getByLabel("Mật khẩu mới",{exact:true}).fill("New-pass-2026");
  await page.getByLabel("Xác nhận mật khẩu mới").fill("New-pass-2026");
  await page.getByRole("button",{name:"Lưu mật khẩu mới"}).click();
  await expect(page.getByText("Đổi mật khẩu thành công.",{exact:false})).toBeVisible();
  await expect(page.getByRole("link",{name:"Đăng nhập lại"})).toHaveAttribute("href","/login");
  expect(sent).toEqual([{currentPassword:"Old-pass-2026",password:"New-pass-2026"}]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("password change rejects confirmation mismatch and displays API denial without disclosing secrets", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/account/password", route => {
    requests += 1;
    return route.fulfill({status:403,json:{error:"Mật khẩu hiện tại không đúng."}});
  });
  await page.goto("/account/security");
  await page.getByLabel("Mật khẩu IAICT hiện tại").fill("Old-pass-2026");
  await page.getByLabel("Mật khẩu mới",{exact:true}).fill("New-pass-2026");
  await page.getByLabel("Xác nhận mật khẩu mới").fill("Mismatch-2026");
  await page.getByRole("button",{name:"Lưu mật khẩu mới"}).click();
  await expect(page.getByRole("alert")).toHaveText("Hai mật khẩu mới không trùng khớp.");
  expect(requests).toBe(0);
  await page.getByLabel("Xác nhận mật khẩu mới").fill("New-pass-2026");
  await page.getByRole("button",{name:"Lưu mật khẩu mới"}).click();
  await expect(page.getByRole("alert")).toHaveText("Mật khẩu hiện tại không đúng.");
  expect(requests).toBe(1);
  await expect(page.getByRole("link",{name:"Đăng nhập lại"})).toHaveCount(0);
});

test("account activation UI never exposes a password form without a valid invitation",async({page})=>{
  await page.goto("/activate",{waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"Kích hoạt tài khoản IAICT"})).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Liên kết kích hoạt không hợp lệ");
  await expect(page.getByRole("button",{name:"Kích hoạt tài khoản"})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Đến trang đăng nhập IAICT"})).toHaveAttribute("href","/login");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("activation reacts to same-tab hash navigation", async ({page}) => {
  await page.goto("/activate");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/activate#token="+ "a".repeat(64));
  await expect(page.getByLabel("Mật khẩu mới")).toBeVisible();
  await expect(page).toHaveURL(/\/activate$/);
});
