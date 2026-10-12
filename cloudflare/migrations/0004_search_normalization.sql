-- Rebuild FTS schema so Vietnamese ASCII queries can match Đ/đ content through *_norm fields.
-- Application code must populate both original and normalized fields in the SAME db.batch() as content publish/update/archive.
DROP TABLE IF EXISTS content_search_fts;

CREATE VIRTUAL TABLE content_search_fts USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  title,
  title_norm,
  summary,
  summary_norm,
  body,
  body_norm,
  route UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);
