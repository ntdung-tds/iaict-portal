/**
 * Strict and pure staging release approval + rollback readiness checks.
 * Unit tests do not access Cloudflare or environment credentials.
 */
const UUID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const SHA = /^[a-f\d]{40}$/i;
const RELEASE_REF = "refs/heads/release/staging-v17-hardened-20261029";

export function validateApprovedStagingCommit({ approvedSha, checkedOutSha, workflowSha, ref }) {
  if (!SHA.test(approvedSha ?? "") || !SHA.test(checkedOutSha ?? "") ||
      !SHA.test(workflowSha ?? "")) {
    throw new Error("RELEASE_COMMIT_SHA_REQUIRED");
  }
  if (ref !== RELEASE_REF) throw new Error("RELEASE_BRANCH_MISMATCH");
  if (approvedSha !== checkedOutSha || approvedSha !== workflowSha) {
    throw new Error("RELEASE_COMMIT_NOT_APPROVED");
  }
  return true;
}

export function validateRollbackReadiness({
  liveDeployment, rollbackVersion, bookmark, expectedVersion,
}) {
  if (!UUID.test(expectedVersion ?? "")) throw new Error("ROLLBACK_VERSION_REQUIRED");
  const versions = liveDeployment?.deployments?.[0]?.versions;
  if (!Array.isArray(versions) || versions.length !== 1 ||
      versions[0]?.version_id !== expectedVersion ||
      versions[0]?.percentage !== 100) {
    throw new Error("ROLLBACK_LIVE_DEPLOYMENT_MISMATCH");
  }
  if (rollbackVersion?.id !== expectedVersion) {
    throw new Error("ROLLBACK_WORKER_VERSION_NOT_RETRIEVABLE");
  }
  if (typeof bookmark?.bookmark !== "string" || !bookmark.bookmark.trim()) {
    throw new Error("ROLLBACK_D1_BOOKMARK_UNAVAILABLE");
  }
  return {
    workerVersion: expectedVersion,
    d1BookmarkAvailable: true,
  };
}
