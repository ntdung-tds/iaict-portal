import test from "node:test";
import assert from "node:assert/strict";
import { validateApprovedStagingCommit, validateRollbackReadiness } from "./staging-release-guards.mjs";

const SHA = "a".repeat(40);
const VERSION = "21ef7ce9-6f82-4381-a474-a3fa9678beb6";
const REF = "refs/heads/release/staging-v17-hardened-20261029";
const commit = { approvedSha: SHA, checkedOutSha: SHA, workflowSha: SHA, ref: REF };
const release = {
  expectedVersion: VERSION,
  liveDeployment: { deployments: [{ versions: [{ version_id: VERSION, percentage: 100 }] }] },
  rollbackVersion: { id: VERSION },
  bookmark: { bookmark: "00000001-00000002" },
};

test("requires an exact explicitly approved immutable release SHA", () => {
  assert.equal(validateApprovedStagingCommit(commit), true);
});

test("rejects missing/malformed approval, checkout mismatch and stale workflow SHA", () => {
  for (const overrides of [
    { approvedSha: undefined }, { approvedSha: "HEAD" }, { approvedSha: "a".repeat(39) },
    { checkedOutSha: "b".repeat(40) }, { workflowSha: "b".repeat(40) },
    { ref: "refs/heads/main" }, { ref: "refs/heads/rc/staging-cms-v17-20261030" },
  ]) {
    assert.throws(() => validateApprovedStagingCommit({ ...commit, ...overrides }),
      /RELEASE_COMMIT_SHA_REQUIRED|RELEASE_COMMIT_NOT_APPROVED|RELEASE_BRANCH_MISMATCH/);
  }
});

test("confirms readable rollback version, no traffic split, and D1 bookmark", () => {
  assert.deepEqual(validateRollbackReadiness(release), {
    workerVersion: VERSION, d1BookmarkAvailable: true,
  });
});

test("fails closed if the staging Worker has been deployed again after approval", () => {
  assert.throws(() => validateRollbackReadiness({
    ...release, liveDeployment: { deployments: [{
      versions: [{ version_id: "293841c3-5e16-4cb2-bd10-5ae38d299f42", percentage: 100 }],
    }] },
  }), /ROLLBACK_LIVE_DEPLOYMENT_MISMATCH/);
});

test("refuses fractional traffic, multiple versions or missing deployment", () => {
  const bad = [
    null, {},
    { deployments: [{ versions: [{ version_id: VERSION, percentage: 50 }] }] },
    { deployments: [{ versions: [
      { version_id: VERSION, percentage: 60 }, { version_id: "293841c3-5e16-4cb2-bd10-5ae38d299f42", percentage: 40 },
    ] }] },
  ];
  for (const liveDeployment of bad) {
    assert.throws(() => validateRollbackReadiness({ ...release, liveDeployment }),
      /ROLLBACK_LIVE_DEPLOYMENT_MISMATCH/);
  }
});

test("refuses a deleted or mismatched rollback version", () => {
  for (const rollbackVersion of [null, {}, { id: "293841c3-5e16-4cb2-bd10-5ae38d299f42" }]) {
    assert.throws(() => validateRollbackReadiness({ ...release, rollbackVersion }),
      /ROLLBACK_WORKER_VERSION_NOT_RETRIEVABLE/);
  }
});

test("refuses absent/invalid D1 Time Travel bookmark", () => {
  for (const bookmark of [null, {}, { bookmark: "" }, { bookmark: "   " }]) {
    assert.throws(() => validateRollbackReadiness({ ...release, bookmark }),
      /ROLLBACK_D1_BOOKMARK_UNAVAILABLE/);
  }
});

test("does not accept non-UUID Worker versions", () => {
  assert.throws(() => validateRollbackReadiness({ ...release, expectedVersion: "staging-latest" }),
    /ROLLBACK_VERSION_REQUIRED/);
});
