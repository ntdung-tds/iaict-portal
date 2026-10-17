PRAGMA foreign_keys = ON;

-- V17 — Full CMS foundation. Existing product/solution/course/project/news tables
-- remain canonical; this migration only fills the missing page/navigation/revision layer.
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  page_type TEXT NOT NULL DEFAULT 'standard',
  summary TEXT,
  body TEXT NOT NULL DEFAULT '',
  layout_json TEXT NOT NULL DEFAULT '{}',
  hero_media_id TEXT,
  seo_json TEXT NOT NULL DEFAULT '{}',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  FOREIGN KEY (hero_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'main',
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  opens_new_tab INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cms_revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_user_id TEXT,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

ALTER TABLE media ADD COLUMN public_url TEXT;

CREATE INDEX IF NOT EXISTS idx_pages_status_updated ON pages(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_type_status ON pages(page_type, status);
CREATE INDEX IF NOT EXISTS idx_navigation_group_sort ON navigation_items(group_name, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_revisions_entity_created ON cms_revisions(entity_type, entity_id, created_at DESC);

INSERT OR IGNORE INTO navigation_items(id, label, href, group_name, sort_order, is_active, opens_new_tab, created_at, updated_at) VALUES
  ('nav-home', 'Trang chủ', '/', 'main', 10, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-about', 'Giới thiệu', '/gioi-thieu', 'main', 20, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-products', 'Sản phẩm & Nền tảng', '/san-pham-nen-tang', 'main', 30, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-solutions', 'Giải pháp & Dịch vụ', '/giai-phap-dich-vu', 'main', 40, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-transfer', 'Chuyển giao công nghệ', '/chuyen-giao-cong-nghe', 'main', 50, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-training', 'Đào tạo & Tập huấn', '/dao-tao-tap-huan', 'main', 60, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-projects', 'Dự án tiêu biểu', '/du-an', 'main', 70, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-news', 'Tin tức', '/tin-tuc', 'main', 80, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nav-contact', 'Liên hệ & Hợp tác', '/lien-he', 'main', 90, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO site_settings(id, organization_name, settings_json, updated_at)
VALUES (
  'default',
  'Viện Ứng dụng Công nghệ Thông tin và Truyền thông',
  '{"siteTitle":"IAICT","siteDescription":"Viện Ứng dụng Công nghệ Thông tin và Truyền thông","contactEmail":"","contactPhone":"","address":"","defaultSeoTitle":"IAICT","defaultSeoDescription":"","socialLinks":{}}',
  CURRENT_TIMESTAMP
);
