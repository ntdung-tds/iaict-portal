using Workerd = import "/workerd/workerd.capnp";

# Local loopback only; NO account bindings, D1, R2 or external services.
const config :Workerd.Config = (
  services = [(name = "mfa", worker = .mfaWorker)],
  sockets = [(name = "http", address = "127.0.0.1:19388", http = (), service = "mfa")]
);

const mfaWorker :Workerd.Worker = (
  modules = [(name = "entrypoint", esModule = embed "probe.bundle.mjs")],
  compatibilityDate = "2026-10-12",
  compatibilityFlags = ["nodejs_compat"]
);
