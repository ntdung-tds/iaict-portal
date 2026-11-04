/**
 * B3.8 private Media R2 janitor — bounded CAS claim before any R2 deletion.
 * Runs ONLY when staging quarantine feature gate explicitly enabled.
 * Never lists or serves arbitrary objects. No public URL or malware verdict.
 */
import type { D1DatabaseLike } from "./cloudflare-db";
import type { MediaR2BucketLike } from "./media-r2-runtime";
import { MEDIA_POLICY } from "./media-policy";

type Row = {
  id: string; state: string; revision: number;
  storage_key: string; actor_user_id: string;
};
export type MediaCleanupResult = Readonly<{
  examined: number; claimed: number; deleted: number; failed: number; tombstonesRemoved: number;
}>;
const LIMIT = 20;
function changes(value: unknown): number {
  try {
    if (!value || typeof value !== "object") return -1;
    const r = value as { success?: boolean; meta?: { changes?: unknown } };
    return r.success !== false && typeof r.meta?.changes === "number" && Number.isSafeInteger(r.meta.changes)
      ? r.meta.changes : -1;
  } catch { return -1; }
}

/**
 * Handles orphaned reservations after 1h, quarantine older than 7d,
 * rejected/failed older than 2d, revoked objects after 24h and previously
 * claimed purge retries after 15m. All date math is DB server-side UTC.
 */
export async function cleanupExpiredPrivateMedia(
  db: D1DatabaseLike, bucket: MediaR2BucketLike,
): Promise<MediaCleanupResult> {
  const pending = await db.prepare(`
    SELECT id, state, revision, storage_key, actor_user_id
    FROM media_r2_quarantine_uploads
    WHERE (state='RESERVED' AND created_at<datetime('now','-1 hour'))
       OR (state='QUARANTINED' AND created_at<datetime('now','-7 days'))
       OR (state IN ('FAILED','ORPHAN_PENDING_PURGE') AND created_at<datetime('now','-2 days'))
       OR (state='REVOKED' AND updated_at<datetime('now','-24 hours'))
       OR (state='PURGE_PENDING' AND updated_at<datetime('now','-15 minutes'))
    ORDER BY created_at ASC
    LIMIT ?`).bind(LIMIT).all<Row>();
  let claimed=0,deleted=0,failed=0;
  for (const row of pending.results) {
    if (!Number.isSafeInteger(row.revision) || row.revision < 0 ||
        !/^quarantine\/v2\/cms-main\/[0-9a-f-]{36}$/.test(row.storage_key)) {
      failed++; continue;
    }
    // The only delete target is the exact DB-owned quarantine key. A
    // concurrent revision/state update loses the claim (0 changes).
    let gotClaim = false;
    try {
      const claim = await db.prepare(`UPDATE media_r2_quarantine_uploads
        SET state='PURGE_PENDING', revision=revision+1, updated_at=datetime('now')
        WHERE id=? AND state=? AND revision=? AND storage_key=?`)
        .bind(row.id,row.state,row.revision,row.storage_key).run();
      gotClaim=changes(claim)===1;
    } catch { gotClaim=false; }
    if (!gotClaim) { failed++; continue; }
    claimed++;
    try {
      await bucket.delete(row.storage_key);
      const completed=await db.batch([
        db.prepare(`UPDATE media_r2_quarantine_uploads
          SET state='PURGED', revision=revision+1, updated_at=datetime('now')
          WHERE id=? AND state='PURGE_PENDING' AND revision=?`)
          .bind(row.id,row.revision+1),
        db.prepare(`INSERT INTO audit_logs
          (id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
          SELECT ?,actor_user_id,'media.quarantine.purged','media_r2_quarantine',id,?,datetime('now')
          FROM media_r2_quarantine_uploads WHERE id=? AND state='PURGED' AND revision=?`)
          .bind(crypto.randomUUID(),JSON.stringify({policy:MEDIA_POLICY.id,state:"PURGED"}),row.id,row.revision+2),
      ]);
      if (changes(completed[0])===1 && changes(completed[1])===1) deleted++;
      else failed++;
    } catch { failed++; /* leave PURGE_PENDING for retry */ }
  }
  // Tombstones persist 90 days. This operation cannot touch R2.
  let tombstonesRemoved=0;
  try {
    const r=await db.prepare(`DELETE FROM media_r2_quarantine_uploads
      WHERE id IN (SELECT id FROM media_r2_quarantine_uploads
        WHERE state='PURGED' AND updated_at<datetime('now','-90 days') LIMIT ?)`)
      .bind(LIMIT).run();
    tombstonesRemoved=Math.max(0,changes(r));
  } catch { /* no dangerous fallback */ }
  return { examined: pending.results.length, claimed, deleted, failed, tombstonesRemoved };
}
