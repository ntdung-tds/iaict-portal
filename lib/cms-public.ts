import { getDatabaseBinding } from "./cloudflare-db";

export type PublicCmsEntity = {
  kind: "page" | "product" | "solution" | "course" | "project";
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body?: string | null;
  category?: string | null;
  seo: { title?: string; description?: string };
  sections: Array<{ label: string; value: unknown }>;
  publishedAt: string | null;
};

type Row = Record<string, unknown>;

function parseJson(value: unknown, fallback: unknown = null) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function seoFrom(value: unknown) {
  const parsed = parseJson(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as { title?: string; description?: string }
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getPublishedPage(slug: string): Promise<PublicCmsEntity | null> {
  const db = getDatabaseBinding();
  const row = await db.prepare(`
    SELECT id, title, slug, summary, body, layout_json, seo_json, published_at
    FROM pages
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `).bind(slug).first<Row>();
  if (!row) return null;
  const layout = parseJson(row.layout_json, {});
  return {
    kind: "page",
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    summary: text(row.summary),
    body: text(row.body),
    seo: seoFrom(row.seo_json),
    sections: layout && typeof layout === "object" && Object.keys(layout as object).length
      ? [{ label: "Thông tin bổ sung", value: layout }]
      : [],
    publishedAt: text(row.published_at),
  };
}

const entityConfig = {
  product: {
    table: "products",
    select: "id, title, slug, summary, category, features_json, technologies_json, benefits_json, integration_notes, seo_json, published_at",
    sections: [
      ["Tính năng", "features_json"],
      ["Công nghệ", "technologies_json"],
      ["Lợi ích", "benefits_json"],
      ["Khả năng tích hợp", "integration_notes"],
    ],
  },
  solution: {
    table: "solutions",
    select: "id, title, slug, summary, problem, scope_json, process_json, deliverables_json, technologies_json, seo_json, published_at",
    sections: [
      ["Bài toán", "problem"],
      ["Phạm vi", "scope_json"],
      ["Quy trình", "process_json"],
      ["Sản phẩm bàn giao", "deliverables_json"],
      ["Công nghệ", "technologies_json"],
    ],
  },
  course: {
    table: "courses",
    select: "id, title, slug, summary, audiences_json, topics_json, objectives_json, modules_json, duration, delivery_modes_json, level, class_size, certificate_note, seo_json, published_at",
    sections: [
      ["Đối tượng", "audiences_json"],
      ["Mục tiêu", "objectives_json"],
      ["Chủ đề", "topics_json"],
      ["Chương trình", "modules_json"],
      ["Hình thức", "delivery_modes_json"],
      ["Thời lượng", "duration"],
      ["Cấp độ", "level"],
      ["Quy mô lớp", "class_size"],
      ["Chứng nhận", "certificate_note"],
    ],
  },
  project: {
    table: "projects",
    select: "id, title, slug, summary, context, solution, scope_json, technologies_json, results_json, replication_potential, seo_json, published_at",
    sections: [
      ["Bối cảnh", "context"],
      ["Giải pháp", "solution"],
      ["Phạm vi", "scope_json"],
      ["Công nghệ", "technologies_json"],
      ["Kết quả", "results_json"],
      ["Khả năng nhân rộng", "replication_potential"],
    ],
  },
} as const;

export async function getPublishedEntity(
  kind: keyof typeof entityConfig,
  slug: string,
): Promise<PublicCmsEntity | null> {
  const config = entityConfig[kind];
  const db = getDatabaseBinding();
  const row = await db.prepare(`
    SELECT ${config.select}
    FROM ${config.table}
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `).bind(slug).first<Row>();
  if (!row) return null;

  const sections = config.sections
    .map(([label, key]) => {
      const raw = row[key];
      const value = key.endsWith("_json") ? parseJson(raw, []) : raw;
      return { label, value };
    })
    .filter((section) => {
      if (section.value === null || section.value === undefined || section.value === "") return false;
      if (Array.isArray(section.value)) return section.value.length > 0;
      if (typeof section.value === "object") return Object.keys(section.value as object).length > 0;
      return true;
    });

  return {
    kind,
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    summary: text(row.summary),
    category: kind === "product" ? text(row.category) : null,
    seo: seoFrom(row.seo_json),
    sections,
    publishedAt: text(row.published_at),
  };
}

export async function listPublishedEntities(kind: keyof typeof entityConfig, limit = 24) {
  const config = entityConfig[kind];
  const db = getDatabaseBinding();
  const rows = await db.prepare(`
    SELECT id, title, slug, summary, published_at
    FROM ${config.table}
    WHERE status = 'published'
    ORDER BY featured DESC, COALESCE(published_at, updated_at) DESC
    LIMIT ?
  `).bind(Math.min(Math.max(limit, 1), 60)).all<{ id: string; title: string; slug: string; summary: string; published_at: string | null }>();
  return rows.results;
}
