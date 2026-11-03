import { describe, expect, it } from "vitest";
import { inspectBoundedMediaStream } from "./media-stream-contract";

const fixture = { maxBytes: 32, maxChunks: 4 };
async function* stream(...parts: unknown[]) {
  for (const part of parts) yield part;
}
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const fail = async (source: unknown, code: string, policy: unknown = fixture) =>
  expect(await inspectBoundedMediaStream(source, policy)).toEqual({ ok: false, code });

describe("Media B3.4 source-only streaming budget; not hosted CMS-MEDIA-004 proof", () => {
  it("counts actual split chunks and captures only 12 signature prefix bytes", async () => {
    const res = await inspectBoundedMediaStream(
      stream(png.subarray(0, 4), png.subarray(4), Uint8Array.from([1, 2, 3, 4, 5])),
      fixture,
    );
    expect(res).toEqual({
      ok: true, totalBytes: 14, chunkCount: 3,
      signaturePrefix: [...png, 1, 2, 3].slice(0, 12),
    });
  });

  it("accepts an exact byte limit but refuses one extra byte with no Content-Length", async () => {
    expect(await inspectBoundedMediaStream(stream(new Uint8Array(16), new Uint8Array(16)), fixture))
      .toMatchObject({ ok: true, totalBytes: 32 });
    await fail(stream(new Uint8Array(16), new Uint8Array(17)), "TOO_LARGE");
  });

  it("checks cumulative size, not just the largest chunk", async () => {
    await fail(stream(new Uint8Array(12), new Uint8Array(12), new Uint8Array(9)), "TOO_LARGE");
  });

  it("rejects empty streams and zero-byte streams", async () => {
    await fail(stream(), "EMPTY_BODY");
    await fail(stream(new Uint8Array(0), new Uint8Array(0)), "EMPTY_BODY");
  });

  it("limits zero-progress chunks and refuses an unbounded chunk train", async () => {
    await fail(stream(...Array.from({ length: 5 }, () => new Uint8Array(0))), "TOO_MANY_CHUNKS");
    await fail(stream(...Array.from({ length: 5 }, () => new Uint8Array(1))), "TOO_MANY_CHUNKS", {
      maxBytes: 100, maxChunks: 4,
    });
  });

  it("rejects malformed chunks even if a shape spoofs a byteLength", async () => {
    for (const bad of [null, 4, "abcd", { byteLength: 2 }, new DataView(new ArrayBuffer(3)), new Uint16Array(1)]) {
      await fail(stream(bad), "INVALID_CHUNK");
    }
  });

  it("checks intrinsic typed-array slots, never overridden subclass length", async () => {
    class Spoofed extends Uint8Array {
      get byteLength(): number { return 1; }
      get length(): number { return 1; }
    }
    await fail(stream(new Spoofed(33)), "TOO_LARGE");
    const good = new Spoofed(4);
    good.set([1, 2, 3, 4]);
    expect(await inspectBoundedMediaStream(stream(good), fixture)).toMatchObject({
      ok: true, totalBytes: 4, signaturePrefix: [1, 2, 3, 4],
    });
  });

  it("rejects Proxy-wrapped bytes and revoked Proxy iterables without exceptions", async () => {
    await fail(stream(new Proxy(png, {})), "INVALID_CHUNK");
    const bad = Proxy.revocable(stream(png), {});
    bad.revoke();
    await fail(bad.proxy, "INVALID_STREAM");
  });

  it("rejects missing and malformed policy without inferring deployed defaults", async () => {
    for (const p of [undefined, null, {}, { maxBytes: 2 }, { maxBytes: 0, maxChunks: 2 },
      { maxBytes: 4, maxChunks: 0 }, { maxBytes: -1, maxChunks: 4 },
      { maxBytes: Infinity, maxChunks: 4 }, { maxBytes: 2.5, maxChunks: 4 },
      { maxBytes: 4, maxChunks: Number.MAX_SAFE_INTEGER + 1 }]) {
      // Pass undefined explicitly: the generic fail fixture supplies a default
      // policy when its optional argument is undefined.
      expect(await inspectBoundedMediaStream(stream(png), p))
        .toEqual({ ok: false, code: "POLICY_NOT_CONFIGURED" });
    }
  });

  it("snapshots both dynamic policy getters exactly once", async () => {
    let bytesReads = 0;
    let chunksReads = 0;
    const changing = {
      get maxBytes() { bytesReads++; return bytesReads === 1 ? 8 : 1000; },
      get maxChunks() { chunksReads++; return chunksReads === 1 ? 2 : 1000; },
    };
    await fail(stream(png), "TOO_LARGE", changing);
    expect(bytesReads).toBe(1);
    expect(chunksReads).toBe(1);
  });

  it("fails closed for policy getter exceptions and revoked policy", async () => {
    await fail(stream(png), "POLICY_NOT_CONFIGURED", {
      get maxBytes() { throw new Error("synthetic"); }, maxChunks: 3,
    });
    const revoked = Proxy.revocable({ maxBytes: 8, maxChunks: 3 }, {});
    revoked.revoke();
    await fail(stream(png), "POLICY_NOT_CONFIGURED", revoked.proxy);
  });

  it("rejects non-async iterable, throwing factory and iterators that throw", async () => {
    await fail([png], "INVALID_STREAM");
    await fail(null, "INVALID_STREAM");
    await fail({ get [Symbol.asyncIterator]() { throw Error("factory"); } }, "INVALID_STREAM");
    await fail({ [Symbol.asyncIterator]: () => ({ next: () => { throw Error("next"); } }) }, "INVALID_STREAM");
  });

  it("asks the source to close on oversize, invalid chunk and chunk-flood rejection", async () => {
    for (const chunks of [[new Uint8Array(33)], [null], [new Uint8Array(0), new Uint8Array(0)]]) {
      let closed = 0;
      let cursor = 0;
      const source = {
        [Symbol.asyncIterator]: () => ({
          next: async () => cursor < chunks.length ? { done: false, value: chunks[cursor++] } : { done: true, value: undefined },
          return: async () => { closed++; return { done: true, value: undefined }; },
        }),
      };
      const policy = { maxBytes: 32, maxChunks: chunks.length === 2 ? 1 : 4 };
      expect((await inspectBoundedMediaStream(source, policy)).ok).toBe(false);
      expect(closed).toBe(1);
    }
  });

  it("reads each yielded chunk value exactly once despite a changing getter", async () => {
    let reads = 0;
    let cursor = 0;
    const source = {
      [Symbol.asyncIterator]: () => ({
        next: async () => cursor++ === 0
          ? { done: false, get value() { reads++; return reads === 1 ? Uint8Array.of(7) : Uint8Array.of(9); } }
          : { done: true, value: undefined },
      }),
    };
    expect(await inspectBoundedMediaStream(source, fixture)).toEqual({
      ok: true, totalBytes: 1, chunkCount: 1, signaturePrefix: [7],
    });
    expect(reads).toBe(1);
  });

  it("reads a dynamic iterator.next getter once, never invokes a substituted method", async () => {
    let getterReads = 0;
    let cursor = 0;
    const source = {
      [Symbol.asyncIterator]: () => ({
        get next() {
          getterReads++;
          if (getterReads > 1) return async () => ({ done: true, value: undefined });
          return async () => cursor++ === 0
            ? { done: false, value: Uint8Array.of(8) }
            : { done: true, value: undefined };
        },
      }),
    };
    expect(await inspectBoundedMediaStream(source, fixture)).toEqual({
      ok: true, totalBytes: 1, chunkCount: 1, signaturePrefix: [8],
    });
    expect(getterReads).toBe(1);
  });

  it("rejects a nonboolean done marker instead of trusting its truthiness", async () => {
    const source = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({ done: "yes", value: Uint8Array.of(3) }),
      }),
    };
    await fail(source, "INVALID_STREAM");
  });

  it("fails closed if source.next or iterator.return throws during cancellation", async () => {
    const source = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({ done: false, value: new Uint8Array(40) }),
        return: async () => { throw Error("cancellation failed"); },
      }),
    };
    await fail(source, "TOO_LARGE");
  });
});
