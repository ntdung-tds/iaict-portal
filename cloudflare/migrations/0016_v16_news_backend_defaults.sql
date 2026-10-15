PRAGMA foreign_keys = ON;

-- V16.3 backend defaults for external-news publication.
-- External sources need deterministic default categories before policy-driven
-- publication can create a valid articles row.

INSERT OR IGNORE INTO article_categories (id, name, slug, sort_order) VALUES
  ('cat-khoa-hoc-cong-nghe', 'Khoa học & Công nghệ', 'khoa-hoc-cong-nghe', 20),
  ('cat-chinh-sach-van-ban', 'Chính sách & Văn bản', 'chinh-sach-van-ban', 80);

UPDATE news_sources
SET default_category_id = 'cat-khoa-hoc-cong-nghe', updated_at = CURRENT_TIMESTAMP
WHERE id = 'mst-gov-vn' AND default_category_id IS NULL;

UPDATE news_sources
SET default_category_id = 'cat-chinh-sach-van-ban', updated_at = CURRENT_TIMESTAMP
WHERE id = 'chinhphu-vn' AND default_category_id IS NULL;

-- Explicit newsroom roles. Existing installations may also retain broader
-- admin/editor roles; application authorization accepts both legacy and these
-- newsroom-specific codes.
INSERT OR IGNORE INTO roles (id, code, name) VALUES
  ('role-news-admin', 'news_admin', 'Newsroom Administrator'),
  ('role-news-editor', 'news_editor', 'Newsroom Editor'),
  ('role-news-reviewer', 'news_reviewer', 'Newsroom Reviewer');

CREATE INDEX IF NOT EXISTS idx_news_sources_default_category
  ON news_sources(default_category_id, is_active);
