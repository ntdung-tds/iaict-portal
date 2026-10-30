import { describe, expect, it } from "vitest";
import type {
  D1BindValue,
  D1DatabaseLike,
  D1PreparedStatementLike,
  D1RunResult,
} from "./cloudflare-db";
import { publishApprovedReviewItem } from "./news-repository";
import type { NewsroomActor } from "./newsroom-auth";

class FakeStatement implements D1PreparedStatementLike {
  params: D1BindValue[] = [];

  constructor(
    readonly query: string,
    private readonly firstValue: unknown = null,
  ) {}

  bind(...values: D1BindValue[]) {
    this.params = values;
    return this;
  }

  async first<T>() {
    return this.firstValue as T | null;
  }

  async all<T>() {
    return { results: [] as T[], success: true };
  }

  async run(): Promise<D1RunResult> {
    return { success: true };
  }
}

class FakeDb implements D1DatabaseLike {
  batchStatements: FakeStatement[] = [];

  prepare(query: string): FakeStatement {
    const firstValue = query.includes("FROM news_review_queue q")
      ? {
          queue_id: "queue-1",
          ingest_item_id: "item-1",
          workflow_status: "approved",
          updated_at: "2026-10-15T02:00:00.000Z",
          suggested_title: "IAICT thử nghiệm quy trình xuất bản tin nguồn",
          suggested_excerpt: "Tóm tắt ngắn phục vụ kiểm thử.",
          suggested_category_id: "cat-khoa-hoc-cong-nghe",
          edited_title: null,
          edited_excerpt: null,
          source_id: "mst-gov-vn",
          source_name: "Cổng Thông tin điện tử Bộ Khoa học và Công nghệ",
          source_url: "https://mst.gov.vn/tin-a",
          canonical_url: "https://mst.gov.vn/tin-a",
          source_published_at: "2026-10-15T00:00:00.000Z",
          fetched_at: "2026-10-15T01:00:00.000Z",
          attribution_text: "Nguồn: Bộ Khoa học và Công nghệ",
          attribution_mode: "custom",
          default_category_id: "cat-khoa-hoc-cong-nghe",
        }
      : null;
    return new FakeStatement(query, firstValue);
  }

  async batch(statements: D1PreparedStatementLike[]) {
    this.batchStatements = statements as FakeStatement[];
    return statements.map(() => ({ success: true }));
  }
}

const actor: NewsroomActor = {
  id: "admin-1",
  email: "editor@iaict.vn",
  displayName: "IAICT Editor",
  roles: ["news_reviewer"],
};

describe("V16 newsroom publication repository", () => {
  it("publishes an approved item in one race-safe D1 batch", async () => {
    const db = new FakeDb();
    const result = await publishApprovedReviewItem(db, actor, "queue-1", "2026-10-15T02:00:00.000Z");

    expect(result.articleId).toBeTruthy();
    expect(result.slug).toContain("iaict-thu-nghiem-quy-trinh-xuat-ban-tin-nguon");

    const sql = db.batchStatements.map((statement) => statement.query).join("\n");
    expect(sql).toContain("INSERT INTO news_publication_claims");
    expect(sql).toContain("INSERT INTO articles");
    expect(sql).toContain("INSERT INTO article_provenance");
    expect(sql).toContain("UPDATE news_review_queue");
    expect(sql).toContain("UPDATE news_ingest_items");
    expect(sql).toContain("INSERT INTO audit_logs");
    expect(sql).toContain("DELETE FROM news_publication_claims");
  });
});
