import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createLocalZipArchive, LOCAL_ZIP_POLICY } from "./media-local-zip";

const bytes = (v: string) => new TextEncoder().encode(v);

function inspectArchive(zip: Uint8Array): Array<{ name: string; bytes: Uint8Array; method: number; crc: number }> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let cursor = 0;
  const output: Array<{ name: string; bytes: Uint8Array; method: number; crc: number }> = [];
  while (cursor + 4 <= zip.byteLength && view.getUint32(cursor, true) === 0x04034b50) {
    const method = view.getUint16(cursor + 8, true);
    const crc = view.getUint32(cursor + 14, true);
    const compressed = view.getUint32(cursor + 18, true);
    const size = view.getUint32(cursor + 22, true);
    const nameLength = view.getUint16(cursor + 26, true);
    const name = new TextDecoder().decode(zip.subarray(cursor + 30, cursor + 30 + nameLength));
    const first = cursor + 30 + nameLength;
    const encoded = zip.subarray(first, first + compressed);
    const decoded = method === 8 ? inflateRawSync(encoded) : new Uint8Array(encoded);
    expect(decoded.byteLength).toBe(size);
    output.push({ name, bytes: decoded, method, crc });
    cursor = first + compressed;
  }
  expect(view.getUint32(cursor, true)).toBe(0x02014b50);
  const trailer = zip.byteLength - 22;
  expect(view.getUint32(trailer, true)).toBe(0x06054b50);
  expect(view.getUint16(trailer + 8, true)).toBe(output.length);
  expect(view.getUint16(trailer + 10, true)).toBe(output.length);
  expect(view.getUint32(trailer + 16, true)).toBe(cursor);
  return output;
}

describe("B3.7 local ZIP32: actual correct archive bytes", () => {
  it("builds a valid multi-file ZIP with compressed text + stored JPEG and UTF-8 names", async () => {
    const txt = bytes("IAICT hỗ trợ nén dữ liệu\n".repeat(5000));
    const img = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x01]);
    const r = await createLocalZipArchive([
      { name: "hồ sơ.txt", bytes: txt },
      { name: "ảnh sản phẩm.jpg", bytes: img },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fileCount).toBe(2);
    expect(r.profileId).toBe("IAICT-LOCAL-ZIP-V1");
    expect(r.serverUploadAllowed).toBe(false);
    const unpacked = inspectArchive(r.bytes);
    expect(unpacked.map(e => e.name)).toEqual(["hồ sơ.txt", "ảnh sản phẩm.jpg"]);
    expect(unpacked[0].bytes).toEqual(txt);
    expect(unpacked[0].method).toBe(8);
    expect(unpacked[1].bytes).toEqual(img);
    expect(unpacked[1].method).toBe(0);
    expect(r.compressedEntries).toBe(1);
    expect(r.archiveBytes).toBeLessThan(r.inputBytes);
  });

  it("stores incompressible content without harmful double recompression", async () => {
    const jpeg = new Uint8Array(3000);
    crypto.getRandomValues(jpeg);
    const r = await createLocalZipArchive([{ name: "photo.jpg", bytes: jpeg }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.compressedEntries).toBe(0);
    expect(inspectArchive(r.bytes)[0].bytes).toEqual(jpeg);
  });

  it("fails on traversal, separators, control chars, ambiguous names and case duplicates", async () => {
    const bad = ["../secret.txt", "folder/a.txt", "folder\\a.txt",
      "evil..txt", ".hidden.txt", "file.txt.", "space .txt ", "a%2fb.txt",
      "a\u202e.txt", "CON.txt", "a".repeat(181) + ".txt"];
    for (const name of bad) {
      const r = await createLocalZipArchive([{ name, bytes: bytes("a") }]);
      expect(r).toEqual({ ok: false, code: "INVALID_FILENAME" });
    }
    expect(await createLocalZipArchive([
      { name: "Báo cáo.txt", bytes: bytes("A") },
      { name: "BÁO CÁO.TXT", bytes: bytes("B") },
    ])).toEqual({ ok: false, code: "DUPLICATE_FILENAME" });
  });

  it("strictly bounds per-file, total bytes, count and refuses empty files", async () => {
    expect(LOCAL_ZIP_POLICY).toMatchObject({
      maxFiles: 20, maxFileBytes: 10 * 1024 * 1024,
      maxInputBytes: 30 * 1024 * 1024, maxArchiveBytes: 40 * 1024 * 1024,
      serverUploadAllowed: false, serverReadAuthorized: false,
    });
    expect(await createLocalZipArchive([])).toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(await createLocalZipArchive(
      Array.from({ length: 21 }, (_, i) => ({ name: String(i), bytes: bytes("A") })),
    )).toEqual({ ok: false, code: "TOO_MANY_FILES" });
    expect(await createLocalZipArchive([{ name: "a.txt", bytes: new Uint8Array(0) }]))
      .toEqual({ ok: false, code: "EMPTY_FILE" });
    expect(await createLocalZipArchive([{ name: "huge.txt", bytes: new Uint8Array(LOCAL_ZIP_POLICY.maxFileBytes + 1) }]))
      .toEqual({ ok: false, code: "FILE_TOO_LARGE" });
    const tenMiB = new Uint8Array(LOCAL_ZIP_POLICY.maxFileBytes);
    const r = await createLocalZipArchive(
      Array.from({ length: 4 }, (_, i) => ({ name: i + ".bin", bytes: tenMiB })),
    );
    expect(r).toEqual({ ok: false, code: "TOTAL_TOO_LARGE" });
  });

  it("rejects revoked proxies, non-byte arrays and spoofed typed arrays", async () => {
    expect(await createLocalZipArchive([{ name: "a.txt", bytes: new Uint16Array([1]) }]))
      .toEqual({ ok: false, code: "INVALID_INPUT" });
    const rev = Proxy.revocable({ name: "a.txt", bytes: bytes("a") }, {});
    rev.revoke();
    expect(await createLocalZipArchive([rev.proxy])).toEqual({ ok: false, code: "INVALID_INPUT" });
    const arr = Proxy.revocable(bytes("a"), {});
    arr.revoke();
    expect(await createLocalZipArchive([{ name: "a.txt", bytes: arr.proxy }]))
      .toEqual({ ok: false, code: "INVALID_INPUT" });
  });

  it("is deterministic for the same bytes, doesn't mutate input and never extracts ZIP", async () => {
    const input = bytes("repeat\n".repeat(100));
    const before = new Uint8Array(input);
    const a = await createLocalZipArchive([{ name: "a.csv", bytes: input }]);
    const b = await createLocalZipArchive([{ name: "a.csv", bytes: input }]);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.bytes).toEqual(b.bytes);
    expect(input).toEqual(before);
    expect(inspectArchive(a.bytes)[0].bytes).toEqual(input);
  });
});
