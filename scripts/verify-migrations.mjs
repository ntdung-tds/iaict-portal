import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expected = new Map([
  ["cloudflare/migrations/0001_core.sql", "72a87d234b8627eb966b8b3c3d506d3e687a8d55"],
  ["cloudflare/migrations/0002_search_fts.sql", "8311e79439b191d347134b44e94f9835aee1b9aa"],
  ["cloudflare/migrations/0003_registration_retention_outbox.sql", "6daca9c147698b654473f1ae63c58499ec772db3"],
  ["cloudflare/migrations/0004_search_normalization.sql", "14dc6df465a2f555f36563b024dddcc70ede300c"],
  ["cloudflare/migrations/0005_idempotency_contracts.sql", "7faad3993865450bc440234921e5e95d74c125ce"],
  ["cloudflare/migrations/0006_upload_hardening.sql", "7e3188c5897e647ac71400819bd3da74427ff530"],
  ["cloudflare/migrations/0007_retention_session_hardening.sql", "49fb2d3d6d45e86c17fd2268468c2efbc0eee2ab"],
  ["cloudflare/migrations/0008_v34_data_integrity.sql", "246b09b0fd8b234c15a624f61ffd6b42b7e1ac87"],
  ["cloudflare/migrations/0009_v341_publication_attempts.sql", "9ebe086cc509b379a7e437b03f274d9a0215968c"],
  ["cloudflare/migrations/0010_v342_build_readiness.sql", "a276bdcdd4435ba533a48077a7501f8c8fccd6d8"],
  ["cloudflare/migrations/0011_v343_reliability.sql", "bf6caaa1e97a0634600f460149a7ca9191c75189"],
]);

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`, "utf8");
  return createHash("sha1").update(header).update(buffer).digest("hex");
}

const failures = [];

for (const [path, expectedSha] of expected) {
  try {
    const content = await readFile(path);
    const actualSha = gitBlobSha(content);
    if (actualSha !== expectedSha) {
      failures.push(`${path}: expected ${expectedSha}, got ${actualSha}`);
    }
  } catch (error) {
    failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  console.error("Canonical migration integrity check FAILED:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nDo not edit migrations 0001-0011. Add a forward-only migration instead.");
  process.exit(1);
}

console.log(`Canonical migration integrity check passed (${expected.size}/${expected.size}).`);
