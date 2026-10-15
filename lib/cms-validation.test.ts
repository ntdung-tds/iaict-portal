import { describe, expect, it } from "vitest";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { getCmsModule } from "./cms-schema";
import { prepareCmsData } from "./cms-validation";

function mockDb(options: { current?: Record<string, unknown> | null; duplicate?: Record<string, unknown> | null } = {}): D1DatabaseLike {
  return {
    prepare(query: string): D1PreparedStatementLike {
      let values: D1BindValue[] = [];
      const statement: D1PreparedStatementLike = {
        bind(...next: D1BindValue[]) { values = next; return statement; },
        async first<T>() {
          if (query.includes("SELECT * FROM") && query.includes("WHERE id = ?")) return (options.current ?? null) as T | null;
          if (query.includes("SELECT id FROM media WHERE public_url")) return (options.duplicate ?? null) as T | null;
          void values;
          return null;
        },
        async all<T>() { return { results: [] as T[] }; },
        async run() { return { success: true }; },
      };
      return statement;
    },
    async batch() { return []; },
  };
}

function moduleConfig(key: string) {
  const config = getCmsModule(key);
  if (!config) throw new Error(`Missing config ${key}`);
  return config;
}

describe("prepareCmsData", () => {
  it("requires a public Media URL instead of exposing storage_key", async () => {
    await expect(prepareCmsData(mockDb(), "media", moduleConfig("media"), null, { type: "image", visibility: "public" }))
      .rejects.toThrow("INVALID_CMS_MEDIA_SOURCE_REQUIRED");
  });

  it("requires HTTPS for Media", async () => {
    await expect(prepareCmsData(mockDb(), "media", moduleConfig("media"), null, {
      type: "image", visibility: "public", public_url: "http://example.com/photo.jpg",
    })).rejects.toThrow("INVALID_CMS_MEDIA_HTTPS_REQUIRED");
  });

  it("generates internal Media metadata from a valid URL", async () => {
    const result = await prepareCmsData(mockDb(), "media", moduleConfig("media"), null, {
      type: "image", visibility: "public", public_url: "https://example.com/assets/photo.jpg",
      metadata_json: "{}",
    });
    expect(String(result.storage_key)).toMatch(/^external\//);
    expect(result.filename).toBe("photo.jpg");
    expect(result.mime_type).toBe("image/jpeg");
    expect(result.public_url).toBe("https://example.com/assets/photo.jpg");
  });

  it("rejects duplicate Media URLs", async () => {
    await expect(prepareCmsData(mockDb({ duplicate: { id: "existing" } }), "media", moduleConfig("media"), null, {
      type: "image", visibility: "public", public_url: "https://example.com/photo.jpg",
    })).rejects.toThrow("INVALID_CMS_MEDIA_URL_DUPLICATE");
  });

  it("rejects a Media type that conflicts with an obvious file format", async () => {
    await expect(prepareCmsData(mockDb(), "media", moduleConfig("media"), null, {
      type: "image", visibility: "public", public_url: "https://example.com/report.pdf",
    })).rejects.toThrow("INVALID_CMS_MEDIA_TYPE_MISMATCH");
  });

  it("rejects negative Media size", async () => {
    await expect(prepareCmsData(mockDb(), "media", moduleConfig("media"), null, {
      type: "image", visibility: "public", public_url: "https://example.com/photo.jpg", size_bytes: -1,
    })).rejects.toThrow("INVALID_CMS_MEDIA_SIZE_INVALID");
  });

  it("enforces required fields when updating existing CMS content", async () => {
    const current = { id: "p1", title: "Old", slug: "old", status: "draft", summary: "Summary" };
    await expect(prepareCmsData(mockDb({ current }), "products", moduleConfig("products"), "p1", { title: "" }))
      .rejects.toThrow("INVALID_CMS_FIELD_TITLE_REQUIRED");
  });

  it("keeps slug auto-generation compatible with validation", async () => {
    const result = await prepareCmsData(mockDb(), "products", moduleConfig("products"), null, {
      title: "Sản phẩm mới", slug: "", status: "draft", summary: "Mô tả",
    });
    expect(result.slug).toBe("");
  });
});
