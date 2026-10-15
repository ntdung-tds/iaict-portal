PRAGMA foreign_keys = ON;

-- V16.2 source adapter configuration.
-- Bộ KH&CN publishes an official RSS directory and feed. Prefer that stable,
-- structured endpoint over HTML discovery for the initial production adapter.
UPDATE news_sources
SET
  entry_url = 'https://mst.gov.vn/rss/tin-tuc-su-kien.rss',
  fetch_strategy = 'rss',
  config_json = '{"phase":"adapter-ready","adapter":"rss","allowed_hosts":["mst.gov.vn"],"max_items":30}',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'mst-gov-vn';

-- The Government Portal homepage currently exposes Government Electronic
-- Newspaper article links. Keep HTML discovery isolated behind a source-specific
-- adapter and restrict accepted article hosts.
UPDATE news_sources
SET
  entry_url = 'https://chinhphu.vn/',
  fetch_strategy = 'html_discovery',
  config_json = '{"phase":"adapter-ready","adapter":"html","allowed_hosts":["chinhphu.vn","baochinhphu.vn"],"max_items":30}',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'chinhphu-vn';
