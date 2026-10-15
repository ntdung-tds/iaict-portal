PRAGMA foreign_keys = ON;

-- Initial official discovery sources for V16.
-- Entry URLs are deliberately conservative homepage/discovery entry points;
-- a stable RSS/API endpoint must be verified before changing fetch_strategy.

INSERT OR IGNORE INTO news_sources (
  id,
  name,
  source_type,
  homepage_url,
  entry_url,
  fetch_strategy,
  trust_level,
  is_active,
  requires_editorial_review,
  attribution_mode,
  attribution_text,
  fetch_interval_minutes,
  config_json,
  created_at,
  updated_at
) VALUES (
  'mst-gov-vn',
  'Cổng Thông tin điện tử Bộ Khoa học và Công nghệ',
  'official_web',
  'https://mst.gov.vn/',
  'https://mst.gov.vn/',
  'html_discovery',
  'official',
  1,
  1,
  'custom',
  'Nguồn: Cổng Thông tin điện tử Bộ Khoa học và Công nghệ (mst.gov.vn)',
  60,
  '{"phase":"discovery","auto_publish":false}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
), (
  'chinhphu-vn',
  'Cổng Thông tin điện tử Chính phủ',
  'official_web',
  'https://chinhphu.vn/',
  'https://chinhphu.vn/',
  'html_discovery',
  'official',
  1,
  1,
  'source_name_and_link',
  NULL,
  60,
  '{"phase":"discovery","auto_publish":false}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
