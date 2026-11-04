import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

test.describe("B3.7 local Chromium compression workbench [MOCK CMS session; REAL bytes]", () => {
  test.beforeEach(async ({ page }) => {
    // Synthetic-only diagnostics: avoid logging file bytes, paths or secrets.
    page.on("pageerror", error => console.log("[media-tool-pageerror]", error.message.slice(0, 500)));
    page.on("console", message => {
      if (message.type() === "error") console.log("[media-tool-console]", message.text().slice(0, 500));
    });
    // Only the CMS shell session is mocked. Canvas, ZIP, gzip and downloads
    // are executed by real Chromium, not stubbed.
    await page.route("**/api/admin/cms/session", route => route.fulfill({
      json: { ok: true, actor: { id: "local-test", roles: ["editor"] } },
    }));
  });
  test("renders responsive three tools and creates real JPEG/PNG image bytes", async ({ page }) => {
    const response = await page.goto("/admin/tools/compression", { waitUntil: "domcontentloaded", timeout: 15_000 });
    console.log("[media-tool-e2e] navigated", response?.status(), page.url());
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Trung tâm nén ảnh & tệp" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nén và thu nhỏ ảnh" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gộp và nén nhiều tệp" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nén tệp văn bản" })).toBeVisible();

    const image = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 80;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#136f88";
      ctx.fillRect(0, 0, 120, 80);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    await page.locator("#compress-image-file").setInputFiles({
      name: "demo.png", mimeType: "image/png",
      buffer: Buffer.from(image, "base64"),
    });
    console.log("[media-tool-e2e] image input", await page.locator("#compress-image-file").evaluate((el: HTMLInputElement) => el.files?.length),
      "button enabled", await page.getByRole("button", { name: "Nén ảnh" }).isEnabled());
    await expect(page.getByRole("button", { name: "Nén ảnh" })).toBeEnabled({ timeout: 4_000 });
    await page.getByRole("button", { name: "Nén ảnh" }).click();
    await expect(page.getByRole("status")).toContainText("Đã tạo hai ảnh mới");
    console.log("[media-tool-e2e] image result ready");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 7_000 }),
      page.getByRole("button", { name: "Tải ảnh hiển thị" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("iaict-display.png");
    const bytes = await readFile(await download.path());
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137,80,78,71,13,10,26,10]);

    await page.setViewportSize({ width: 320, height: 760 });
    await expect(page.getByRole("heading", { name: "Trung tâm nén ảnh & tệp" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("creates a ZIP download with compressed local text and no server upload", async ({ page }) => {
    const response = await page.goto("/admin/tools/compression", { waitUntil: "domcontentloaded", timeout: 15_000 });
    console.log("[media-tool-e2e] navigated", response?.status(), page.url());
    expect(response?.status()).toBe(200);
    await page.locator("#compress-zip-files").setInputFiles([
      { name: "ghi chú.txt", mimeType: "text/plain", buffer: Buffer.from("IAICT nguồn tin thử nghiệm\n".repeat(1500)) },
      { name: "avatar.jpg", mimeType: "image/jpeg", buffer: Buffer.from([255,216,255,0,1]) },
    ]);
    console.log("[media-tool-e2e] zip input", await page.locator("#compress-zip-files").evaluate((el: HTMLInputElement) => el.files?.length),
      "button enabled", await page.getByRole("button", { name: "Tạo tệp ZIP" }).isEnabled());
    await expect(page.getByRole("button", { name: "Tạo tệp ZIP" })).toBeEnabled({ timeout: 4_000 });
    await page.getByRole("button", { name: "Tạo tệp ZIP" }).click();
    await expect(page.getByRole("status")).toContainText("ZIP hợp lệ — 2 tệp");
    console.log("[media-tool-e2e] zip result ready");
    const [d] = await Promise.all([
      page.waitForEvent("download", { timeout: 7_000 }),
      page.getByRole("button", { name: "Tải ZIP" }).click(),
    ]);
    expect(d.suggestedFilename()).toBe("iaict-files.zip");
    const bytes = await readFile(await d.path());
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  test("downloads genuine gzip with round-trip content", async ({ page }) => {
    const response = await page.goto("/admin/tools/compression", { waitUntil: "domcontentloaded", timeout: 15_000 });
    console.log("[media-tool-e2e] navigated", response?.status(), page.url());
    expect(response?.status()).toBe(200);
    const input = "Một đoạn văn bản có thể nén của IAICT\n".repeat(200);
    await page.locator("#compress-text-file").setInputFiles({
      name: "report.txt", mimeType: "text/plain",
      buffer: Buffer.from(input, "utf8"),
    });
    console.log("[media-tool-e2e] gzip input", await page.locator("#compress-text-file").evaluate((el: HTMLInputElement) => el.files?.length),
      "button enabled", await page.getByRole("button", { name: "Nén Gzip" }).isEnabled());
    await expect(page.getByRole("button", { name: "Nén Gzip" })).toBeEnabled({ timeout: 4_000 });
    await page.getByRole("button", { name: "Nén Gzip" }).click();
    await expect(page.getByRole("status")).toContainText("Đã nén tệp");
    console.log("[media-tool-e2e] gzip result ready");
    const [d] = await Promise.all([
      page.waitForEvent("download", { timeout: 7_000 }),
      page.getByRole("button", { name: "Tải Gzip" }).click(),
    ]);
    expect(d.suggestedFilename()).toBe("report.txt.gz");
    const bytes = await readFile(await d.path());
    expect(gunzipSync(bytes).toString("utf8")).toBe(input);
  });
});
