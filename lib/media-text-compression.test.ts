import { describe, expect, it } from "vitest";
import {
  TEXT_FILE_COMPRESSION,
  compressEligibleTextFile,
} from "./media-text-compression";

const bytes = (s: string) => new TextEncoder().encode(s);

async function unzip(bytes: Uint8Array): Promise<string> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(bytes); controller.close(); },
  });
  const stream = source.pipeThrough(new DecompressionStream("gzip"));
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) { out.set(chunk,pos); pos += chunk.byteLength; }
  return new TextDecoder("utf-8",{fatal:true}).decode(out);
}

describe("B3.6 file gzip: real local roundtrip, never a new CMS upload allowlist", () => {
  it("keeps upload acceptance disabled and supports only text-like content", () => {
    expect(TEXT_FILE_COMPRESSION).toMatchObject({
      uploadEnabled: false, archivesAcceptedAsUploads: false, algorithm: "gzip",
      minimumSavingsPercent: 5,
    });
    expect(TEXT_FILE_COMPRESSION.eligibleMimeTypes).toEqual(["text/plain","text/csv","application/json"]);
    expect(Object.isFrozen(TEXT_FILE_COMPRESSION.eligibleMimeTypes)).toBe(true);
  });

  it("actually gzip compresses highly redundant text and roundtrips byte content", async () => {
    const input = bytes("IAICT portal nội dung thử nghiệm\n".repeat(2500));
    const untouched = input.slice();
    const result = await compressEligibleTextFile(input, "text/plain");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profileId).toBe("IAICT-TEXT-GZIP-V1");
    expect(result.storageEncoding).toBe("gzip");
    expect(result.savingsBytes).toBeGreaterThan(0);
    expect(result.outputBytes).toBeLessThan(result.inputBytes);
    expect(result.isUploadPermission).toBe(false);
    expect(input).toEqual(untouched);
    expect(await unzip(result.bytes)).toBe(new TextDecoder().decode(input));
  });

  it("does not increase size for tiny content or fabricate a gzip storage flag", async () => {
    const result = await compressEligibleTextFile(bytes("abc"),"text/plain");
    expect(result).toMatchObject({
      ok: true, storageEncoding: "identity", inputBytes: 3,
      outputBytes: 3, savingsBytes: 0, isUploadPermission: false,
    });
    expect(result.ok && result.bytes).toEqual(bytes("abc"));
  });

  it("rejects already-compressed and unsafe document/active formats", async () => {
    for (const mime of [
      "application/pdf", "application/zip", "application/x-gzip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg","image/png","image/webp","image/svg+xml","text/html",
      "application/javascript", "application/octet-stream", "text/plain;charset=utf-8",
    ]) {
      expect(await compressEligibleTextFile(bytes("content"),mime))
        .toEqual({ ok:false, code:"UNSUPPORTED_FORMAT" });
    }
  });

  it("rejects empty, malicious binary views, excessive and invalid UTF8 text bytes", async () => {
    expect(await compressEligibleTextFile(new Uint8Array(0),"text/plain"))
      .toEqual({ ok: false, code: "EMPTY_INPUT" });
    expect(await compressEligibleTextFile(new Uint16Array([65]),"text/plain"))
      .toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(await compressEligibleTextFile(new Uint8Array(TEXT_FILE_COMPRESSION.maxInputBytes+1),"text/plain"))
      .toEqual({ ok: false, code: "TOO_LARGE" });
    const p = Proxy.revocable(bytes("hello"),{}); p.revoke();
    expect(await compressEligibleTextFile(p.proxy,"text/plain"))
      .toEqual({ok:false,code:"INVALID_INPUT"});
    expect(await compressEligibleTextFile(Uint8Array.from([0xc3,0x28]),"text/plain"))
      .toEqual({ok:false,code:"INVALID_TEXT_ENCODING"});
  });

  it("roundtrips CSV and JSON without changing media MIME allowlist", async () => {
    const input = bytes('{"title":"sản phẩm","description":"'+"x".repeat(2000)+'"}');
    const result = await compressEligibleTextFile(input,"application/json");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.storageEncoding).toBe("gzip");
    expect(JSON.parse(await unzip(result.bytes))).toEqual(JSON.parse(new TextDecoder().decode(input)));

    const csv = await compressEligibleTextFile(bytes("id,name\n1,IAICT\n".repeat(200)),"text/csv");
    expect(csv.ok).toBe(true);
    if (!csv.ok) return;
    expect(csv.storageEncoding).toBe("gzip");
  });
});
