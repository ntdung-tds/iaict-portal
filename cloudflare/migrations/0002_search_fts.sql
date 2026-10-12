CREATE VIRTUAL TABLE IF NOT EXISTS content_search_fts USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  title,
  summary,
  body,
  route UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);

-- Bootstrap FTS table only. Runtime content publish/update/archive MUST mutate source content + FTS rows in the same D1 db.batch(); see 0004 and infra/SEARCH_INDEX.md. FTS is derived/rebuildable data.
