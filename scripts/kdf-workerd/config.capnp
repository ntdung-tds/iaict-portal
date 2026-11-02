using Workerd = import "/workerd/workerd.capnp";

# Isolated local CI process. No Cloudflare account, D1, R2 or outbound bindings.
const config :Workerd.Config = (
  services = [(name = "kdf", worker = .kdfWorker)],
  sockets = [(name = "http", address = "127.0.0.1:19387", http = (), service = "kdf")]
);

const kdfWorker :Workerd.Worker = (
  modules = [(name = "entrypoint", esModule = embed "probe.mjs")],
  compatibilityDate = "2026-10-12",
  compatibilityFlags = ["nodejs_compat"]
);
