import fs from "node:fs";
import path from "node:path";

const bundleDir = path.resolve(
  ".cloudflare/output/v0/workers/default/bundle",
);
const staticDir = path.join(bundleDir, "_next", "static");

if (!fs.existsSync(bundleDir)) {
  throw new Error(
    `[prepare-cf-output] Missing Cloudflare Build Output bundle: ${bundleDir}. Run the staging build first.`,
  );
}

fs.mkdirSync(staticDir, { recursive: true });

const rootModules = fs
  .readdirSync(bundleDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"));

if (rootModules.length === 0) {
  throw new Error(
    `[prepare-cf-output] No root JavaScript modules found in ${bundleDir}.`,
  );
}

let copied = 0;
let alreadyPresent = 0;

for (const entry of rootModules) {
  const source = path.join(bundleDir, entry.name);
  const target = path.join(staticDir, entry.name);

  // vinext 1.2 + Cloudflare Vite v2 can currently emit a few virtual modules
  // at the bundle root while the generated worker-entry imports those modules
  // from _next/static. Mirror only missing modules so cf's module graph is
  // complete without overwriting hashed/static chunks that already exist.
  if (fs.existsSync(target)) {
    alreadyPresent += 1;
    continue;
  }

  fs.copyFileSync(source, target);
  copied += 1;
}

const workerEntries = fs
  .readdirSync(staticDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isFile() && /^worker-entry-.*\.js$/.test(entry.name),
  )
  .map((entry) => entry.name);

console.log(
  `[prepare-cf-output] mirrored ${copied} root module(s); ${alreadyPresent} already present; worker entries: ${workerEntries.length}.`,
);
