import { describe, expect, it } from "vitest";
import { compressLocalImage } from "./media-local-image";

const headerPng = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const headerWebp = Uint8Array.from([82,73,70,70,4,0,0,0,87,69,66,80,86,80,56,88,10,0,0,0,0]);

describe("B3.7 local image encoding safety preflight — no server scan claims", () => {
  it("rejects invalid payload, invalid type and incorrect magic bytes before decoding", async () => {
    expect(await compressLocalImage("image")).toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(await compressLocalImage(new Blob(["<svg />"], { type: "image/svg+xml" })))
      .toEqual({ ok: false, code: "UNSUPPORTED_IMAGE" });
    expect(await compressLocalImage(new Blob(["not png"], { type: "image/png" })))
      .toEqual({ ok: false, code: "SIGNATURE_MISMATCH" });
  });

  it("rejects oversized bytes before reading or creating canvas", async () => {
    const huge = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/png" });
    expect(await compressLocalImage(huge)).toEqual({ ok: false, code: "IMAGE_TOO_LARGE" });
  });

  it("rejects animated APNG and WebP before local decode", async () => {
    const animatedPng = Uint8Array.from([...headerPng.subarray(0,8), 0,0,0,8, 97,99,84,76, 1,2,3,4,5,6,7,8, 0,0,0,0]);
    expect(await compressLocalImage(new Blob([animatedPng], { type: "image/png" })))
      .toEqual({ ok: false, code: "ANIMATION_DENIED" });
    const animatedWebp = Uint8Array.from(headerWebp);
    animatedWebp[20] = 2;
    expect(await compressLocalImage(new Blob([animatedWebp], { type: "image/webp" })))
      .toEqual({ ok: false, code: "ANIMATION_DENIED" });
  });

  it("gracefully states browser decoder unavailable during a Node-only unit test", async () => {
    const fakePng = new Blob([headerPng], { type: "image/png" });
    expect(await compressLocalImage(fakePng)).toEqual({ ok: false, code: "DECODER_UNAVAILABLE" });
  });

  it("rejects forged blob properties and revoked proxy payloads", async () => {
    class Forged extends Blob {
      override get size() { return 1; }
      override get type() { return "image/png"; }
    }
    const disguised = new Forged(["not a PNG"], { type: "application/octet-stream" });
    expect(await compressLocalImage(disguised)).toEqual({ ok: false, code: "UNSUPPORTED_IMAGE" });
    const proxy = Proxy.revocable(new Blob([headerPng], { type: "image/png" }), {});
    proxy.revoke();
    expect(await compressLocalImage(proxy.proxy)).toEqual({ ok: false, code: "INVALID_INPUT" });
  });
});
