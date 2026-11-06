// Local-only, synthetic PBKDF2 boundary proof. No secrets, databases or sessions.
const ITERATIONS = Object.freeze([100_000, 100_001]);
const password = new TextEncoder().encode("synthetic-probe-never-a-real-password");
const salt = new Uint8Array([1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 242]);

export default {
  async fetch(request) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/kdf-probe")
      return new Response("Not found", { status: 404 });
    const results = [];
    for (const iterations of ITERATIONS) {
      const started = performance.now();
      try {
        const key = await crypto.subtle.importKey("raw", password, "PBKDF2", false, ["deriveBits"]);
        const derived = await crypto.subtle.deriveBits(
          { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256
        );
        results.push({
          iterations, outcome: "SUCCESS", bits: derived.byteLength * 8,
          elapsed_ms: Math.round(performance.now() - started)
        });
      } catch (error) {
        results.push({
          iterations, outcome: "REJECTED",
          error_name: error?.name || "UnknownError",
          elapsed_ms: Math.round(performance.now() - started)
        });
      }
    }
    return new Response(JSON.stringify({
      isolation: "LOCAL_WORKERD", compatibility_date: "2026-10-12",
      compatibility_flags: ["nodejs_compat"], results,
      deferred: { iterations: 600000, outcome: "NOT_RUN_RESOURCE_GATE" }
    }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
};
